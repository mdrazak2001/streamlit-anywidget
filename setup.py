from pathlib import Path

import setuptools

this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setuptools.setup(
    name="streamlit-anywidget",
    version="0.1.1",
    author="Mohammed Razak",
    author_email="mohammedrazak2001@gmail.com",
    description="Streamlit component that enables anywidget support",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/mdrazak2001/streamlit-anywidget",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "streamlit >= 0.63",
        "anywidget"
    ],
    extras_require={
        "devel": [
            "wheel",
            "pytest==7.4.0",
            "playwright==1.48.0",
            "requests==2.31.0",
            "pytest-playwright-snapshot==1.0",
            "pytest-rerunfailures==12.0",
        ]
    }
)
