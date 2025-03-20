import streamlit.components.v1 as components
import streamlit as st

_streamlit_anywidget = components.declare_component(
    "streamlit_anywidget",
    url="http://localhost:3001"
)

def streamlit_anywidget(name='Streamlit', key=None):
    return _streamlit_anywidget(name=name, default=0)

return_value = streamlit_anywidget('razaks')
st.write(return_value)

return_value = streamlit_anywidget('mohammed')
st.write(return_value)