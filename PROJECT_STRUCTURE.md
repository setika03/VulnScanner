# Project Structure

```
vulnerability-scanner/
├── app.py                      # Flask web application
├── vulnerability_scanner.py   # Core vulnerability scanner
├── example_usage.py            # Programmatic usage examples
├── requirements.txt            # Python dependencies
├── config.json                 # Scanner configuration
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # Documentation
├── PROJECT_STRUCTURE.md        # This file
├── templates/
│   └── index.html             # Main web interface template
└── static/
    ├── css/
    │   └── style.css          # Web application styling
    └── js/
        └── app.js             # Frontend JavaScript
```

## File Descriptions

### Core Files

- **app.py**: Flask web application that provides a web interface for the vulnerability scanner
- **vulnerability_scanner.py**: Main scanner module with all scanning functionality
- **example_usage.py**: Examples of how to use the scanner programmatically

### Configuration

- **requirements.txt**: All Python dependencies needed for the project
- **config.json**: Default scanner configuration (ports, headers, SSL settings)
- **.env.example**: Template for environment variables (copy to .env for local use)

### Web Interface

- **templates/index.html**: Main HTML template for the web interface
- **static/css/style.css**: Styling for the web application
- **static/js/app.js**: Frontend JavaScript for interactivity

### Documentation

- **README.md**: Complete documentation with usage instructions
- **PROJECT_STRUCTURE.md**: This file

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the web application:
   ```bash
   python app.py
   ```

3. Open your browser to:
   ```
   http://localhost:5000
   ```

4. Or use the command line:
   ```bash
   python vulnerability_scanner.py example.com
   ```

## Development

The project is structured to be easily extensible:

- Add new scan types to `vulnerability_scanner.py`
- Add new API endpoints to `app.py`
- Modify the UI in `templates/index.html` and `static/`
- Update configuration in `config.json`
