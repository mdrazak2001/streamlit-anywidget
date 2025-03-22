import streamlit.components.v1 as components
import streamlit as st
import os
import json
import inspect

# Determine if the component should use development server or the bundled version
_RELEASE = False

if not _RELEASE:
    _component_func = components.declare_component(
        "streamlit_anywidget",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("streamlit_anywidget", path=build_dir)

def anywidget(widget_instance, key=None):
    """
    Create a new instance of the anywidget component in Streamlit.
    
    Parameters
    ----------
    widget_instance : anywidget.AnyWidget
        The widget instance to display
    key : str or None
        An optional key that uniquely identifies this component
    
    Returns
    -------
    dict
        The widget state data returned from the frontend
    """
    # Check if the widget has the _esm attribute (required for anywidget)
    if not hasattr(widget_instance, "_esm"):
        st.error(f"Widget {widget_instance.__class__.__name__} does not have an _esm attribute")
        return {}
    
    # Get the ESM module content
    esm_content = getattr(widget_instance, "_esm")
    
    # Check if ESM content is a property function (sometimes the case in anywidget)
    if callable(esm_content) and not inspect.isclass(esm_content):
        try:
            esm_content = esm_content()
        except Exception as e:
            st.error(f"Failed to call _esm function: {str(e)}")
            return {}
    
    # Get CSS content if available
    css_content = None
    if hasattr(widget_instance, "_css"):
        css_attr = getattr(widget_instance, "_css")
        if callable(css_attr) and not inspect.isclass(css_attr):
            try:
                css_content = css_attr()
            except Exception as e:
                st.warning(f"Failed to call _css function: {str(e)}")
        else:
            css_content = css_attr
    
    # Extract the widget's current state - only get traits marked with sync=True
    widget_data = {}
    for name, trait in widget_instance.traits().items():
        # Skip private traits, non-synced traits, and known problematic traits
        if (name.startswith('_') or 
            name in ['comm', 'keys', 'log', 'layout'] or 
            not trait.metadata.get('sync', False)):
            continue
        
        try:
            value = getattr(widget_instance, name)
            # Test serialization
            json.dumps({name: value})
            widget_data[name] = value
        except (TypeError, OverflowError) as e:
            st.warning(f"Attribute '{name}' of widget couldn't be serialized to JSON and will be ignored.")
    
    # Pass the data to the frontend
    component_value = _component_func(
        widget_data=widget_data,
        widget_class=widget_instance.__class__.__name__,
        esm_content=esm_content,
        css_content=css_content,
        key=key,
        default={}
    )
    
    # Update the widget instance with any changes from the frontend
    if component_value and isinstance(component_value, dict):
        for key, value in component_value.items():
            if hasattr(widget_instance, key):
                try:
                    current_value = getattr(widget_instance, key)
                    # Only update if values are different to avoid triggering unnecessary callbacks
                    if current_value != value:
                        setattr(widget_instance, key, value)
                except Exception as e:
                    st.warning(f"Could not update widget attribute '{key}': {str(e)}")
    
    return component_value