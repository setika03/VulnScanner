// Global variables
let currentScanId = null;
let statusCheckInterval = null;
let scanHistory = [];
let vulnChart = null;
let trendChart = null;

// DOM Elements
const scanForm = document.getElementById('scanForm');
const scanBtn = document.getElementById('scanBtn');
const depsBtn = document.getElementById('depsBtn');
const codeBtn = document.getElementById('codeBtn');
const codePathGroup = document.getElementById('codePathGroup');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const downloadBtn = document.getElementById('downloadBtn');
const newScanBtn = document.getElementById('newScanBtn');
const settingsForm = document.getElementById('settingsForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeTabs();
    initializeCharts();
    loadScanHistory();
    loadSettings();
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetSection = item.getAttribute('data-section');
            document.getElementById(`${targetSection}Section`).classList.add('active');
            
            // Update page title
            pageTitle.textContent = item.textContent.trim();
        });
    });
}

// Tabs
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show target tab content
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });
}

// Charts
function initializeCharts() {
    // Vulnerability Distribution Chart
    const vulnCtx = document.getElementById('vulnChart').getContext('2d');
    vulnChart = new Chart(vulnCtx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#ef4444',
                    '#f97316',
                    '#eab308',
                    '#22c55e',
                    '#3b82f6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
    
    // Scan Trends Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Vulnerabilities Found',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#94a3b8'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#475569' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#475569' }
                }
            }
        }
    });
}

// Event Listeners
scanForm.addEventListener('submit', handleScanSubmit);
depsBtn.addEventListener('click', handleDependencyScan);
codeBtn.addEventListener('click', handleCodeScan);
downloadBtn.addEventListener('click', handleDownload);
newScanBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    scanForm.reset();
});
settingsForm.addEventListener('submit', handleSettingsSave);

// Toggle code path input
codeBtn.addEventListener('click', () => {
    codePathGroup.style.display = codePathGroup.style.display === 'none' ? 'block' : 'none';
});

// Handle main scan submission
async function handleScanSubmit(e) {
    e.preventDefault();
    
    const target = document.getElementById('target').value;
    const scanType = document.getElementById('scanType').value;
    
    if (!target) {
        alert('Please enter a target');
        return;
    }
    
    // Show progress
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    scanBtn.disabled = true;
    scanBtn.textContent = '🔍 Scanning...';
    
    try {
        const response = await fetch('/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ target, scan_type: scanType }),
        });
        
        const data = await response.json();
        
        if (data.scan_id) {
            currentScanId = data.scan_id;
            checkScanStatus(data.scan_id);
        } else {
            throw new Error('No scan ID returned');
        }
    } catch (error) {
        console.error('Scan error:', error);
        alert('Failed to start scan: ' + error.message);
        resetScanUI();
    }
}

// Check scan status periodically
function checkScanStatus(scanId) {
    statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/scan/status/${scanId}`);
            const status = await response.json();
            
            if (status.status === 'completed') {
                clearInterval(statusCheckInterval);
                progressFill.style.width = '100%';
                progressText.textContent = '✅ Scan completed!';
                
                // Get results
                await getScanResults(scanId);
                resetScanUI();
            } else if (status.status === 'error') {
                clearInterval(statusCheckInterval);
                alert('Scan failed: ' + (status.error || 'Unknown error'));
                resetScanUI();
            } else if (status.status === 'running') {
                const progress = status.progress || 0;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `🔍 Scanning... ${progress}%`;
            }
        } catch (error) {
            console.error('Status check error:', error);
            clearInterval(statusCheckInterval);
            resetScanUI();
        }
    }, 1000);
}

// Get scan results
async function getScanResults(scanId) {
    try {
        const response = await fetch(`/scan/results/${scanId}`);
        const results = await response.json();
        
        // Add to history
        addToScanHistory(results);
        
        // Display results
        displayResults(results);
        
        // Update dashboard
        updateDashboard(results);
    } catch (error) {
        console.error('Failed to get results:', error);
        alert('Failed to retrieve scan results');
    }
}

// Display results in the UI
function displayResults(results) {
    resultsSection.style.display = 'block';
    
    // Count vulnerabilities by severity
    const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
    };
    
    results.vulnerabilities.forEach(vuln => {
        const severity = vuln.severity?.toLowerCase() || 'info';
        if (counts[severity] !== undefined) {
            counts[severity]++;
        }
    });
    
    results.warnings.forEach(warning => {
        const severity = warning.severity?.toLowerCase() || 'low';
        if (counts[severity] !== undefined) {
            counts[severity]++;
        }
    });
    
    results.info.forEach(info => {
        counts.info++;
    });
    
    // Update summary cards
    document.getElementById('criticalCount').textContent = counts.critical;
    document.getElementById('highCount').textContent = counts.high;
    document.getElementById('mediumCount').textContent = counts.medium;
    document.getElementById('lowCount').textContent = counts.low;
    document.getElementById('infoCount').textContent = counts.info;
    
    // Display vulnerabilities
    const vulnList = document.getElementById('vulnerabilitiesList');
    vulnList.innerHTML = '';
    
    if (results.vulnerabilities.length === 0) {
        vulnList.innerHTML = '<p class="no-data">No vulnerabilities found</p>';
    } else {
        results.vulnerabilities.forEach(vuln => {
            vulnList.innerHTML += createResultItem(vuln);
        });
    }
    
    // Display warnings
    const warningList = document.getElementById('warningsList');
    warningList.innerHTML = '';
    
    if (results.warnings.length === 0) {
        warningList.innerHTML = '<p class="no-data">No warnings found</p>';
    } else {
        results.warnings.forEach(warning => {
            warningList.innerHTML += createResultItem(warning);
        });
    }
    
    // Display info
    const infoList = document.getElementById('infoList');
    infoList.innerHTML = '';
    
    if (results.info.length === 0) {
        infoList.innerHTML = '<p class="no-data">No additional information</p>';
    } else {
        results.info.forEach(info => {
            infoList.innerHTML += createResultItem(info);
        });
    }
}

// Create HTML for a result item
function createResultItem(item) {
    const severity = item.severity?.toLowerCase() || 'info';
    const title = item.type || 'Unknown';
    const description = item.description || item.message || JSON.stringify(item);
    
    return `
        <div class="result-item severity-${severity}">
            <span class="severity-badge ${severity}">${severity.toUpperCase()}</span>
            <h4>${title}</h4>
            <p>${description}</p>
        </div>
    `;
}

// Update Dashboard
function updateDashboard(results) {
    // Update stats cards
    const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
    };
    
    results.vulnerabilities.forEach(vuln => {
        const severity = vuln.severity?.toLowerCase() || 'info';
        if (counts[severity] !== undefined) {
            counts[severity]++;
        }
        counts.total++;
    });
    
    document.getElementById('statCritical').textContent = counts.critical;
    document.getElementById('statHigh').textContent = counts.high;
    document.getElementById('statMedium').textContent = counts.medium;
    document.getElementById('statLow').textContent = counts.low;
    document.getElementById('statTotalScans').textContent = scanHistory.length;
    
    // Update vulnerability chart
    vulnChart.data.datasets[0].data = [
        counts.critical,
        counts.high,
        counts.medium,
        counts.low,
        results.info.length
    ];
    vulnChart.update();
    
    // Update trend chart
    const labels = scanHistory.map((scan, index) => `Scan ${index + 1}`);
    const data = scanHistory.map(scan => scan.vulnerabilities.length);
    
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = data;
    trendChart.update();
    
    // Update recent scans
    updateRecentScans();
}

// Scan History Management
function addToScanHistory(results) {
    scanHistory.unshift({
        ...results,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 scans
    if (scanHistory.length > 20) {
        scanHistory = scanHistory.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    
    // Update history display
    updateHistoryList();
    updateRecentScans();
}

function loadScanHistory() {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
        scanHistory = JSON.parse(saved);
        updateHistoryList();
        updateRecentScans();
        updateDashboardStats();
    }
}

function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (scanHistory.length === 0) {
        historyList.innerHTML = '<p class="no-data">No scan history available.</p>';
        return;
    }
    
    historyList.innerHTML = scanHistory.map((scan, index) => {
        const date = new Date(scan.timestamp).toLocaleString();
        const vulnCount = scan.vulnerabilities.length;
        const warningCount = scan.warnings.length;
        
        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-target">${scan.target}</div>
                    <div class="history-item-meta">${date}</div>
                </div>
                <div class="history-item-stats">
                    <div class="history-stat">
                        <div class="history-stat-value">${vulnCount}</div>
                        <div class="history-stat-label">Vulns</div>
                    </div>
                    <div class="history-stat">
                        <div class="history-stat-value">${warningCount}</div>
                        <div class="history-stat-label">Warnings</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateRecentScans() {
    const recentList = document.getElementById('recentScansList');
    const recentScans = scanHistory.slice(0, 5);
    
    if (recentScans.length === 0) {
        recentList.innerHTML = '<p class="no-data">No scans yet. Start a new scan to see results here.</p>';
        return;
    }
    
    recentList.innerHTML = recentScans.map((scan, index) => {
        const date = new Date(scan.timestamp).toLocaleString();
        const vulnCount = scan.vulnerabilities.length;
        
        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-target">${scan.target}</div>
                    <div class="history-item-meta">${date}</div>
                </div>
                <div class="history-item-stats">
                    <div class="history-stat">
                        <div class="history-stat-value">${vulnCount}</div>
                        <div class="history-stat-label">Vulns</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateDashboardStats() {
    let totalCritical = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;
    
    scanHistory.forEach(scan => {
        scan.vulnerabilities.forEach(vuln => {
            const severity = vuln.severity?.toLowerCase() || 'info';
            if (severity === 'critical') totalCritical++;
            else if (severity === 'high') totalHigh++;
            else if (severity === 'medium') totalMedium++;
            else if (severity === 'low') totalLow++;
        });
    });
    
    document.getElementById('statCritical').textContent = totalCritical;
    document.getElementById('statHigh').textContent = totalHigh;
    document.getElementById('statMedium').textContent = totalMedium;
    document.getElementById('statLow').textContent = totalLow;
    document.getElementById('statTotalScans').textContent = scanHistory.length;
}

// Settings
function loadSettings() {
    const saved = localStorage.getItem('scannerSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('timeout').value = settings.timeout || 10;
        document.getElementById('maxThreads').value = settings.maxThreads || 50;
        document.getElementById('userAgent').value = settings.userAgent || 'VulnerabilityScanner/1.0';
    }
}

async function handleSettingsSave(e) {
    e.preventDefault();
    
    const settings = {
        timeout: document.getElementById('timeout').value,
        maxThreads: document.getElementById('maxThreads').value,
        userAgent: document.getElementById('userAgent').value
    };
    
    localStorage.setItem('scannerSettings', JSON.stringify(settings));
    
    try {
        const response = await fetch('/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        
        if (response.ok) {
            alert('Settings saved successfully!');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Settings error:', error);
        alert('Failed to save settings: ' + error.message);
    }
}

// Handle dependency scan
async function handleDependencyScan() {
    try {
        const response = await fetch('/scan/dependencies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const results = await response.json();
        
        if (results.status === 'completed') {
            alert(`Dependency scan completed. Found ${results.count} vulnerabilities.`);
            
            // Display results
            const mockResults = {
                target: 'Dependencies',
                vulnerabilities: results.vulnerabilities || [],
                warnings: [],
                info: [],
                timestamp: new Date().toISOString()
            };
            displayResults(mockResults);
            addToScanHistory(mockResults);
        } else {
            throw new Error(results.error || 'Scan failed');
        }
    } catch (error) {
        console.error('Dependency scan error:', error);
        alert('Failed to scan dependencies: ' + error.message);
    }
}

// Handle code scan
async function handleCodeScan() {
    const path = document.getElementById('codePath').value || '.';
    
    try {
        const response = await fetch('/scan/code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });
        
        const results = await response.json();
        
        if (results.status === 'completed') {
            alert(`Code scan completed. Found ${results.count} security issues.`);
            
            // Display results
            const mockResults = {
                target: `Code: ${path}`,
                vulnerabilities: results.issues || [],
                warnings: [],
                info: [],
                timestamp: new Date().toISOString()
            };
            displayResults(mockResults);
            addToScanHistory(mockResults);
        } else {
            throw new Error(results.error || 'Scan failed');
        }
    } catch (error) {
        console.error('Code scan error:', error);
        alert('Failed to scan code: ' + error.message);
    }
}

// Handle report download
function handleDownload() {
    if (currentScanId) {
        window.location.href = `/download/${currentScanId}`;
    } else {
        alert('No scan results to download');
    }
}

// Reset scan UI
function resetScanUI() {
    scanBtn.disabled = false;
    scanBtn.textContent = '🔍 Start Scan';
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
}
