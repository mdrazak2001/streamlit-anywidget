import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from "streamlit-component-lib"
import React, { useEffect, useState, useRef } from "react"

interface StreamlitAnyWidgetProps extends ComponentProps {
  args: {
    widget_data: any
    widget_class: string
    esm_content: string
    css_content?: string
  }
}

/**
 * AnyWidget component for Streamlit
 */
const StreamlitAnyWidget = (props: StreamlitAnyWidgetProps) => {
  const { args } = props
  const { widget_data, widget_class, esm_content, css_content } = args
  const [widgetState, setWidgetState] = useState(widget_data || {})
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetInstanceRef = useRef<any>(null)
  const modelRef = useRef<any>(null)
  
  // Load and execute the widget code
  useEffect(() => {
    if (!esm_content) {
      console.error("No ESM content provided for the widget")
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="padding: 10px; border: 1px solid #f63366; border-radius: 5px; background-color: #ffe5ec;">
            <h3 style="margin: 0; color: #f63366;">Widget Loading Error</h3>
            <p>No ESM module content provided for this widget.</p>
          </div>
        `
      }
      return
    }
    
    // Add CSS if provided
    if (css_content && typeof css_content === 'string') {
      const styleId = `style-${widget_class}`;
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = css_content;
        document.head.appendChild(styleEl);
      }
    }
    
    let isMounted = true;
    
    const loadWidget = async () => {
      try {
        console.log("Loading widget from ESM content");
        
        // Determine which type of ESM format we're dealing with
        const isClassFormat = esm_content.includes('export default class');
        const isModuleFormat = esm_content.includes('export default {') || 
                              esm_content.includes('export default{');
        
        if (!containerRef.current || !isMounted) {
          return;
        }
        
        // Clear container
        containerRef.current.innerHTML = '';
        
        if (isClassFormat) {
          // Handle class-based format (export default class Widget {...})
          const classMatch = esm_content.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/);
          if (!classMatch) {
            throw new Error("Could not find class definition in ESM content");
          }
          
          const className = classMatch[1];
          
          // Replace ESM syntax with standard JS class
          const transformedCode = esm_content
            .replace(/export\s+default\s+class/, 'class')
            .replace(/^\s*import.*?;?\s*$/gm, '') // Remove import statements if any
            .replace(/^\s*export.*?;?\s*$/gm, ''); // Remove additional export statements if any
            
          // Create function that returns the widget class
          const functionBody = `
            ${transformedCode}
            return ${className};
          `;
          
          const WidgetClassFactory = new Function(functionBody);
          const WidgetClass = WidgetClassFactory();
          
          if (!WidgetClass) {
            throw new Error("No widget class found in the module");
          }
          
          // Create widget instance
          const widgetInstance = new WidgetClass({
            ...widgetState,
            container: containerRef.current
          });
          
          console.log("Widget instance created (class format)", widgetInstance);
          
          // Store instance ref
          widgetInstanceRef.current = widgetInstance;
          
          // Set up change listener
          if (typeof widgetInstance.on === 'function') {
            widgetInstance.on('change', (changes: any) => {
              console.log("Widget change event", changes);
              const newState = { ...widgetState, ...changes };
              setWidgetState(newState);
              Streamlit.setComponentValue(newState);
            });
          }
        } 
        else if (isModuleFormat) {
          // Handle module format (export default { render })
          // First clean up the module code to make it evaluable
          const moduleCode = esm_content
            .replace(/export\s+default\s*{/, 'const module = {')
            .replace(/^\s*import.*?;?\s*$/gm, '') // Remove import statements
            .replace(/^\s*export.*?;?\s*$/gm, '') // Remove other exports
            + '; return module;';
          
          // Create and evaluate module
          const moduleFactory = new Function(moduleCode);
          const widgetModule = moduleFactory();
          
          if (!widgetModule || typeof widgetModule.render !== 'function') {
            throw new Error("No render function found in the module");
          }
          
          // Create a model object that handles the communication
          const model = {
            attributes: { ...widgetState },
            callbacks: {} as Record<string, Function[]>,
            get: function(key: string) {
              console.log('Getting value for', key, ':', this.attributes[key]);
              return this.attributes[key];
            },
            set: function(key: string, value: any) {
              console.log('Setting value for', key, ':', value);
              this.attributes[key] = value;
            },
            save_changes: function() {
              console.log('Saving changes:', this.attributes);
              
              // Trigger any change callbacks
              if (this.callbacks['change'] && Array.isArray(this.callbacks['change'])) {
                this.callbacks['change'].forEach((cb: Function) => cb());
              }
              
              // Send updates to Streamlit
              Streamlit.setComponentValue(this.attributes);
              setWidgetState({ ...this.attributes });
            },
            on: function(event: string, callback: Function) {
              console.log('Registering callback for event:', event);
              if (!this.callbacks[event]) {
                this.callbacks[event] = [];
              }
              this.callbacks[event].push(callback);
              
              // For property-specific change events
              if (event.startsWith('change:') && callback) {
                const propName = event.split(':')[1];
                console.log('Registered property change callback for', propName);
              }
            }
          };
          
          // Store model reference
          modelRef.current = model;
          
          // Call render function
          widgetModule.render({ 
            model: model, 
            el: containerRef.current 
          });
          
          console.log("Widget rendered (module format)");
        } 
        else {
          throw new Error("Unsupported ESM format. Must use 'export default class' or 'export default { render }'");
        }
        
        // Update frame height
        setTimeout(() => {
          Streamlit.setFrameHeight();
        }, 100);
        
      } catch (error: any) {
        console.error("Error loading widget:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 10px; border: 1px solid #f63366; border-radius: 5px; background-color: #ffe5ec;">
              <h3 style="margin: 0; color: #f63366;">Widget Loading Error</h3>
              <p>Error: ${error.message}</p>
              <pre style="overflow: auto; max-height: 200px; background: #f9f9f9; padding: 10px;">${error.stack}</pre>
            </div>
          `;
        }
      }
    };
    
    loadWidget();
    
    return () => {
      isMounted = false;
    };
  }, [esm_content, css_content]);
  
  // Update frame height whenever container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      Streamlit.setFrameHeight();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Update widget when data changes from Python
  useEffect(() => {
    console.log("Data changed from Python:", widget_data);
    
    // Skip initial render where widgetState === widget_data
    const initialRender = Object.keys(widgetState).length === 0 && 
                         Object.keys(widget_data).length === 0;
    if (initialRender) return;
    
    if (widgetInstanceRef.current) {
      // Class-based widget format
      Object.entries(widget_data || {}).forEach(([key, value]) => {
        if (widgetInstanceRef.current[key] !== value) {
          try {
            console.log(`Updating class widget property ${key} to:`, value);
            widgetInstanceRef.current[key] = value;
            // Re-render if the widget has a render method
            if (typeof widgetInstanceRef.current.render === 'function') {
              widgetInstanceRef.current.render();
            }
          } catch (error) {
            console.warn(`Failed to update widget property ${key}:`, error);
          }
        }
      });
    } else if (modelRef.current) {
      // Module-based widget format
      let hasChanges = false;
      
      Object.entries(widget_data || {}).forEach(([key, value]) => {
        const currentValue = modelRef.current.attributes[key];
        if (currentValue !== value) {
          console.log(`Updating module widget property ${key} from ${currentValue} to:`, value);
          modelRef.current.set(key, value);
          hasChanges = true;
          
          // Trigger property-specific change events
          if (modelRef.current.callbacks['change:' + key]) {
            modelRef.current.callbacks['change:' + key].forEach((cb: Function) => cb());
          }
        }
      });
      
      // If there were changes, trigger general change events
      if (hasChanges && modelRef.current.callbacks['change']) {
        modelRef.current.callbacks['change'].forEach((cb: Function) => cb());
      }
      
      // Update widget state
      setWidgetState({ ...modelRef.current.attributes });
    }
  }, [widget_data]);
  
  return (
    <div className="streamlit-anywidget-container" style={{ padding: '10px' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: '50px' }}></div>
    </div>
  );
};

export default withStreamlitConnection(StreamlitAnyWidget);