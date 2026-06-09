#!/usr/bin/env python3
"""
Example usage of the Vulnerability Scanner
Demonstrates how to use the scanner programmatically
"""

from vulnerability_scanner import VulnerabilityScanner, load_config, scan_dependencies, scan_code_with_bandit


def example_basic_scan():
    """Example: Basic full scan on a target"""
    print("="*50)
    print("Example 1: Basic Full Scan")
    print("="*50)
    
    scanner = VulnerabilityScanner("example.com")
    results = scanner.run_full_scan()
    scanner.save_report("example_scan.json")
    print(f"Found {len(results['vulnerabilities'])} vulnerabilities\n")


def example_config_scan():
    """Example: Scan with custom configuration"""
    print("="*50)
    print("Example 2: Scan with Configuration")
    print("="*50)
    
    config = load_config("config.json")
    scanner = VulnerabilityScanner("example.com", config)
    
    # Run specific scans
    scanner.port_scan()
    scanner.http_security_headers()
    scanner.save_report("config_scan.json")
    print()


def example_specific_scans():
    """Example: Run specific scan types"""
    print("="*50)
    print("Example 3: Specific Scan Types")
    print("="*50)
    
    scanner = VulnerabilityScanner("example.com")
    
    # Only port scan
    print("Running port scan only...")
    scanner.port_scan()
    
    # Only SSL/TLS check
    print("Running SSL/TLS check only...")
    scanner.ssl_tls_check()
    
    scanner.save_report("specific_scans.json")
    print()


def example_dependency_scan():
    """Example: Scan Python dependencies"""
    print("="*50)
    print("Example 4: Dependency Scanning")
    print("="*50)
    
    vulnerabilities = scan_dependencies()
    if vulnerabilities:
        print(f"Found {len(vulnerabilities)} vulnerable dependencies")
    print()


def example_code_scan():
    """Example: Scan Python code"""
    print("="*50)
    print("Example 5: Code Security Analysis")
    print("="*50)
    
    # Scan current directory
    issues = scan_code_with_bandit(".")
    if issues:
        print(f"Found {len(issues)} security issues")
    print()


if __name__ == "__main__":
    print("\nVulnerability Scanner - Example Usage\n")
    
    # Uncomment the examples you want to run:
    
    # example_basic_scan()
    # example_config_scan()
    # example_specific_scans()
    # example_dependency_scan()
    # example_code_scan()
    
    print("\nNote: Uncomment the example functions you want to run in this file")
    print("Make sure to replace 'example.com' with your actual target")
