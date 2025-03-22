# Streamlit-AnyWidget


A Streamlit component that brings the power of [AnyWidget](https://github.com/manzt/anywidget) to Streamlit applications. Create and use custom interactive widgets directly in your Streamlit apps without iframe limitations.

## 🌟 Features

- **Full AnyWidget Compatibility**: Works with both class-based and module-based widget formats
- **Custom Styling**: Apply CSS to your widgets for beautiful integration with Streamlit
- **Bidirectional Communication**: State updates flow seamlessly between Python and JavaScript
- **Simple API**: Familiar interface for AnyWidget users

## 📦 Installation

```bash
pip install streamlit-anywidget
```

Requires:
- streamlit >= 0.63
- anywidget

## 🚀 Quick Start

```python
import streamlit as st
from streamlit_anywidget import anywidget
from anywidget import AnyWidget
import traitlets

# Create a simple counter widget
class CounterWidget(AnyWidget):
    value = traitlets.Int(0).tag(sync=True)
    
    _esm = """
    export default class CounterWidget {
      constructor(args) {
        this.container = args.container;
        this.value = args.value || 0;
        this.render();
        this.callbacks = [];
      }
      
      render() {
        this.container.innerHTML = `
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center;">
            <h2>Counter: ${this.value}</h2>
            <button id="increment" style="padding: 8px 16px; background: #4CAF50; color: white; border-radius: 4px;">
              Increment
            </button>
          </div>
        `;
        
        this.container.querySelector('#increment').addEventListener('click', () => {
          this.value += 1;
          this.render();
          this.callbacks.forEach(callback => callback({ value: this.value }));
        });
      }
      
      on(event, callback) {
        if (event === 'change') {
          this.callbacks.push(callback);
        }
      }
    }
    """

# Display the widget in Streamlit
st.title("Counter Widget Example")
counter = CounterWidget()
widget_state = anywidget(counter, key="counter")

# Interact with the widget state
st.write(f"Current value: {counter.value}")
```

## 🎮 Demo Widgets

### Basic Counter Widget

A simple counter widget showcasing basic interactivity.

![Alt Text](Counter.gif)

### Text Input Widget

Sync text input between Streamlit and a custom text widget.

![Alt Text](Text.gif)

### Module-based Widget

Using the module-based format for more complex widgets.

![Alt Text](Module_Counter.gif)

## 🔄 How It Works

Streamlit-AnyWidget creates a bridge between Streamlit's component system and AnyWidget:

1. **Widget Definition**: Define your widget in Python with AnyWidget
2. **Streamlit Integration**: Use the `anywidget()` function to render it in Streamlit
3. **State Synchronization**: Changes in either Python or JavaScript automatically sync

## 📋 API Reference

### `anywidget(widget_instance, key=None)`

Renders an AnyWidget instance within Streamlit.

**Parameters:**
- `widget_instance`: An AnyWidget instance
- `key`: Optional unique key for the component (string)

**Returns:**
- Dictionary containing the current widget state

## 💡 Example Use Cases

- **Custom Controls**: Create specialized UI controls tailored to your data
- **Interactive Visualizations**: Build charts and graphs with interactive elements
- **Form Elements**: Design custom form inputs with validation and feedback
- **Games & Demos**: Create interactive demos and simple games

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

- [AnyWidget](https://anywidget.dev/) - The foundation for this component
- [Streamlit](https://streamlit.io/) - The awesome framework that makes this possible