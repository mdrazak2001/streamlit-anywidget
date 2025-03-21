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
  }
}

/**
 * AnyWidget component for Streamlit
 */
const StreamlitAnyWidget = (props: StreamlitAnyWidgetProps) => {
  const { args } = props
  console.log('args: ', args)
  const { widget_data, widget_class, esm_content } = args
  const [widgetState, setWidgetState] = useState(widget_data || {})
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetInstanceRef = useRef<any>(null)
  
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
    
    let isMounted = true
    
    const loadWidget = async () => {
      try {
        console.log("Loading widget from ESM content")
        
        // Convert ESM code to regular class definition
        // This is the key fix - we need to transform the ESM syntax to standard JS
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
          
        // Create a new function body that defines the class and returns it
        const functionBody = `
          ${transformedCode}
          return ${className};
        `;
        
        // Create function that returns the widget class
        const WidgetClassFactory = new Function(functionBody);
        const WidgetClass = WidgetClassFactory();
        
        if (!WidgetClass) {
          console.error("No widget class found in the module");
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="padding: 10px; border: 1px solid #f63366; border-radius: 5px; background-color: #ffe5ec;">
                <h3 style="margin: 0; color: #f63366;">Widget Loading Error</h3>
                <p>Could not find widget class in the module.</p>
              </div>
            `;
          }
          return;
        }
        
        if (!containerRef.current || !isMounted) {
          return;
        }
        
        // Clean up the container
        containerRef.current.innerHTML = '';
        
        // Create the widget instance
        const widgetInstance = new WidgetClass({
          ...widgetState,
          container: containerRef.current
        });
        
        console.log("Widget instance created", widgetInstance);
        
        // Store the widget instance reference
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
  }, [esm_content]);
  
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
    if (widgetInstanceRef.current) {
      Object.entries(widget_data || {}).forEach(([key, value]) => {
        if (widgetInstanceRef.current[key] !== value) {
          try {
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
    }
  }, [widget_data]);
  
  return (
    <div className="streamlit-anywidget-container" style={{ padding: '10px' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: '50px' }}></div>
    </div>
  );
};

export default withStreamlitConnection(StreamlitAnyWidget);