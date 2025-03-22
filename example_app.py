import streamlit as st
from streamlit_anywidget import anywidget

try:
    from anywidget import AnyWidget
    import traitlets
    
    st.title("AnyWidget in Streamlit Demo")
    st.write("This demonstrates the integration of AnyWidget with Streamlit via a custom component.")
    
    # Create a counter widget
    class CounterWidget(AnyWidget):
        value = traitlets.Int(0).tag(sync=True)
        
        _esm = """
        export default class CounterWidget {
          constructor(args) {
            this.container = args.container;
            this.value = args.value || 0;
            this.render();
            
            // Create event handling functionality
            this.callbacks = [];
          }
          
          render() {
            this.container.innerHTML = `
              <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                <h2 style="margin-top: 0;">Counter: ${this.value}</h2>
                <div style="display: flex; justify-content: center; gap: 10px;">
                  <button id="decrement" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px;">-</button>
                  <button id="increment" style="padding: 8px 16px; background: #4CAF50; color: white; border: 1px solid #4CAF50; border-radius: 4px;">+</button>
                </div>
              </div>
            `;
            
            // Add event listeners
            const incrementButton = this.container.querySelector('#increment');
            const decrementButton = this.container.querySelector('#decrement');
            
            incrementButton.addEventListener('click', () => {
              this.value += 1;
              this.render();
              // Notify about changes
              this.callbacks.forEach(callback => callback({ value: this.value }));
            });
            
            decrementButton.addEventListener('click', () => {
              this.value -= 1;
              this.render();
              // Notify about changes
              this.callbacks.forEach(callback => callback({ value: this.value }));
            });
          }
          
          // Simple event system
          on(event, callback) {
            if (event === 'change') {
              this.callbacks.push(callback);
            }
          }
        }
        """
    
    # Create the counter widget instance and display it
    st.subheader("Counter Widget")
    counter = CounterWidget()
    counter_state = anywidget(counter, key="counter")
    
    # Display the current value
    st.write(f"Current counter value: {counter.value}")

    
    # Add a slider to control the counter
    new_value = st.slider("Set counter value", 0, 20, counter.value)
    if new_value != counter.value:
        counter.value = new_value
        counter_state['value'] = new_value

    with st.expander("Counter Debug Info"):
        st.write("Counter State:", counter_state)
        st.json({
            "counter_value": counter.value,
        })
    
    # Add a separator
    st.markdown("---")
    
    # Add a text input widget
    class TextWidget(AnyWidget):
        text = traitlets.Unicode("Streamlit x AnyWidget").tag(sync=True)
        
        _esm = """
        export default class TextWidget {
          constructor(args) {
            this.container = args.container;
            this.text = args.text || "Hello World";
            this.callbacks = [];
            this.render();
          }
          
          render() {
            this.container.innerHTML = `
              <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <input type="text" value="${this.text}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
                <div style="color: #555; font-size: 14px;">Type something above</div>
              </div>
            `;
            
            const input = this.container.querySelector('input');
            input.addEventListener('input', (e) => {
              this.text = e.target.value;
              this.callbacks.forEach(callback => callback({ text: this.text }));
            });
          }
          
          on(event, callback) {
            if (event === 'change') {
              this.callbacks.push(callback);
            }
          }
        }
        """
    
    # Create and display the text widget
    st.subheader("Text Widget Test")
    text_widget = TextWidget()
    text_state = anywidget(text_widget, key="text")
    
    st.write(f"Current text: {text_widget.text}")
    
    # Show debug info
    with st.expander("Text Debug Info"):
        st.write("Text State:", text_state)
        st.json({
            "text_value": text_widget.text
        })

    # Add a separator
    st.markdown("---")
    st.subheader("Module Counter Widget Test")
    # Create a counter widget using module-based format
    class ModuleCounterWidget(AnyWidget):
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
    
    # Create the module-based counter widget
    module_counter = ModuleCounterWidget()
    module_counter_state = anywidget(module_counter, key="module_counter")

    # Show debug info
    with st.expander("Module Counter Debug Info"):
        st.write("Module-based Counter State:", module_counter_state)
        st.json({
            "module_counter_value": module_counter.value
        })




except ImportError:
    st.error("""
    This example requires anywidget. Please install it with:
    
    ```
    pip install anywidget
    ```
    """)