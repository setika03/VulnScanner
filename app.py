#!/usr/bin/env python3
"""
Vulnerability Scanner Web Application
Flask-based web interface for the vulnerability scanner
"""

from flask import Flask, render_template, request, jsonify, send_file
from vulnerability_scanner import VulnerabilityScanner, load_config, scan_dependencies, scan_code_with_bandit
import json
import os
from datetime import datetime
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Store scan results in memory (in production, use a database)
scan_results = {}
scan_status = {}


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.route('/scan', methods=['POST'])
def run_scan():
    """Run a vulnerability scan"""
    data = request.json
    target = data.get('target', '')
    scan_type = data.get('scan_type', 'full')
    
    if not target:
        return jsonify({'error': 'Target is required'}), 400
    
    # Generate scan ID
    scan_id = f"{target}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    scan_status[scan_id] = {'status': 'running', 'progress': 0}
    
    # Run scan in background thread
    def run_background_scan():
        try:
            scanner = VulnerabilityScanner(target)
            
            if scan_type == 'full':
                scanner.run_full_scan()
            elif scan_type == 'ports':
                scanner.port_scan()
            elif scan_type == 'headers':
                scanner.http_security_headers()
            elif scan_type == 'ssl':
                scanner.ssl_tls_check()
            
            # Save results
            scan_results[scan_id] = scanner.results
            scan_status[scan_id] = {'status': 'completed', 'progress': 100}
        except Exception as e:
            scan_status[scan_id] = {'status': 'error', 'error': str(e)}
    
    thread = threading.Thread(target=run_background_scan)
    thread.start()
    
    return jsonify({'scan_id': scan_id, 'status': 'started'})


@app.route('/scan/status/<scan_id>')
def get_scan_status(scan_id):
    """Get the status of a running scan"""
    status = scan_status.get(scan_id, {'status': 'not_found'})
    return jsonify(status)


@app.route('/scan/results/<scan_id>')
def get_scan_results(scan_id):
    """Get the results of a completed scan"""
    results = scan_results.get(scan_id)
    if results:
        return jsonify(results)
    return jsonify({'error': 'Scan not found'}), 404


@app.route('/scan/dependencies', methods=['POST'])
def scan_deps():
    """Scan Python dependencies"""
    try:
        vulnerabilities = scan_dependencies()
        return jsonify({
            'status': 'completed',
            'vulnerabilities': vulnerabilities,
            'count': len(vulnerabilities) if vulnerabilities else 0
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/scan/code', methods=['POST'])
def scan_code():
    """Scan Python code"""
    data = request.json
    path = data.get('path', '.')
    
    try:
        issues = scan_code_with_bandit(path)
        return jsonify({
            'status': 'completed',
            'issues': issues,
            'count': len(issues) if issues else 0
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/download/<scan_id>')
def download_report(scan_id):
    """Download scan report as JSON"""
    results = scan_results.get(scan_id)
    if results:
        filename = f"scan_report_{scan_id}.json"
        temp_file = f"temp_{filename}"
        with open(temp_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        return send_file(temp_file, as_attachment=True, download_name=filename)
    return jsonify({'error': 'Scan not found'}), 404


@app.route('/config')
def get_config():
    """Get current configuration"""
    config = load_config()
    return jsonify(config)


@app.route('/config', methods=['POST'])
def update_config():
    """Update configuration"""
    data = request.json
    try:
        with open('config.json', 'w') as f:
            json.dump(data, f, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
