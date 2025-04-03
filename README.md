# Streamlit-AnyWidget
[![Downloads](https://static.pepy.tech/badge/streamlit-anywidget)](https://pepy.tech/project/streamlit-anywidget)
[![Downloads](https://static.pepy.tech/badge/streamlit-anywidget/month)](https://pepy.tech/project/streamlit-anywidget)
[![Downloads](https://static.pepy.tech/badge/streamlit-anywidget/week)](https://pepy.tech/project/streamlit-anywidget)

A Streamlit component that brings the power of [AnyWidget](https://github.com/manzt/anywidget) to Streamlit applications. Create and use custom interactive widgets directly in your Streamlit apps without iframe limitations.

## 🌟 Features

- **Full AnyWidget Compatibility**: Works with both class-based and module-based widget formats
- **Custom Styling**: Apply CSS to your widgets for beautiful integration with Streamlit
- **Bidirectional Communication**: State updates flow seamlessly between Python and JavaScript
- **Simple API**: Familiar interface for AnyWidget users

## 📦 Installation

Streamlit-AnyWidget is distributed via [PyPI](https://pypi.org/project/streamlit-anywidget/).

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
        function render({ model, el }) {
            // Create function to get current value from model
            let count = () => model.get("value");
            
            // Create button element
            let btn = document.createElement("button");
            btn.classList.add("counter-button");
            btn.innerHTML = `Module-based Counter: ${count()}`;
            
            // Handle click event
            btn.addEventListener("click", () => {
                model.set("value", count() + 1);
                model.save_changes();
                // Update UI immediately
                btn.innerHTML = `Module-based Counter: ${count()}`;
            });
            
            // Listen for changes from Python
            model.on("change:value", () => {
                console.log("Value changed to:", count());
                btn.innerHTML = `Module-based Counter: ${count()}`;
            });
            
            // Add to DOM
            el.appendChild(btn);
        }
        export default { render };
        """
        
        _css = """
        .counter-button {
            background-image: linear-gradient(to right, #a1c4fd, #c2e9fb);
            border: 0;
            border-radius: 10px;
            padding: 10px 50px;
            color: black;
            font-weight: bold;
            cursor: pointer;
        }
        .counter-button:hover {
            background-image: linear-gradient(to right, #c2e9fb, #a1c4fd);
        }
        """

# Display the widget in Streamlit
st.title("Counter Widget Example")
counter = CounterWidget()
counter_state = anywidget(counter, key="counter")

# Interact with the widget state
st.write(f"Current value: {counter.value}")

# Show debug info
with st.expander("Module Counter Debug Info"):
    st.write("Module-based Counter State:", counter_state)
    st.json({
        "module_counter_value": counter.value
    })
```

## 🎮 Demo Widgets

### Basic Counter Widget

A simple counter widget showcasing basic interactivity.

![Counter Demo](https://raw.githubusercontent.com/mdrazak2001/streamlit-anywidget/refs/heads/main/Counter.gif)

### Text Input Widget

Sync text input between Streamlit and a custom text widget.

![Text Demo](https://raw.githubusercontent.com/mdrazak2001/streamlit-anywidget/refs/heads/main/Text.gif)

### Module-based Widget

Using the module-based format for more complex widgets.

![Module Counter Demo](https://raw.githubusercontent.com/mdrazak2001/streamlit-anywidget/refs/heads/main/Module_Counter.gif)

## 🎯 Try the Demos

To see all available widgets in action, run:
```bash
streamlit run examples.py
```

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
