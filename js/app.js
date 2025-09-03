// Bid Tracking Dashboard - Main JavaScript File

class BidTrackingDashboard {
    constructor() {
        this.jobs = [];
        this.filteredJobs = [];
        this.currentEditId = null;
        this.currentView = 'table';
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.loadSampleData();
        this.updateDisplay();
        this.populateEstimatorFilter();
    }

    // Data Management
    loadData() {
        const savedJobs = localStorage.getItem('constructionJobs');
        if (savedJobs) {
            this.jobs = JSON.parse(savedJobs);
        }
    }

    saveData() {
        localStorage.setItem('constructionJobs', JSON.stringify(this.jobs));
    }

    loadSampleData() {
        if (this.jobs.length === 0) {
            this.jobs = [
                {
                    id: Date.now() + 1,
                    projectName: "Downtown Office Complex",
                    clientName: "Metro Development Corp",
                    location: "123 Main St, Downtown",
                    estimator: "John Smith",
                    deadline: "2024-02-15",
                    status: "In Progress",
                    description: "12-story office building with underground parking and retail space on ground floor"
                },
                {
                    id: Date.now() + 2,
                    projectName: "Residential Subdivision Phase 2",
                    clientName: "Sunrise Homes LLC",
                    location: "Oak Valley Drive",
                    estimator: "Sarah Johnson",
                    deadline: "2024-01-30",
                    status: "Submitted",
                    description: "45 single-family homes with community amenities including playground and walking trails"
                },
                {
                    id: Date.now() + 3,
                    projectName: "Highway 101 Bridge Repair",
                    clientName: "State Department of Transportation",
                    location: "Highway 101, Mile Marker 45",
                    estimator: "Mike Wilson",
                    deadline: "2024-01-25",
                    status: "Follow-up Required",
                    description: "Structural repairs and deck replacement for 200-foot bridge span"
                }
            ];
            this.saveData();
        }
    }

    // Event Binding
    bindEvents() {
        // Modal controls
        document.getElementById('addJobBtn').addEventListener('click', () => this.openJobModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('estimatorFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // View toggle
        document.getElementById('tableViewBtn').addEventListener('click', () => this.switchView('table'));
        document.getElementById('cardViewBtn').addEventListener('click', () => this.switchView('card'));
        
        // Modal close on overlay click
        document.getElementById('jobModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeJobModal();
        });
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeExportModal();
        });
    }

    // Job Management
    openJobModal(job = null) {
        this.currentEditId = job ? job.id : null;
        const modal = document.getElementById('jobModal');
        const title = document.getElementById('modalTitle');
        
        title.textContent = job ? 'Edit Job' : 'Add New Job';
        
        if (job) {
            document.getElementById('projectName').value = job.projectName;
            document.getElementById('clientName').value = job.clientName;
            document.getElementById('location').value = job.location;
            document.getElementById('estimator').value = job.estimator;
            document.getElementById('deadline').value = job.deadline;
            document.getElementById('status').value = job.status;
            document.getElementById('description').value = job.description || '';
        } else {
            document.getElementById('jobForm').reset();
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeJobModal() {
        document.getElementById('jobModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditId = null;
    }

    saveJob() {
        const form = document.getElementById('jobForm');
        const formData = new FormData(form);
        
        const jobData = {
            projectName: document.getElementById('projectName').value.trim(),
            clientName: document.getElementById('clientName').value.trim(),
            location: document.getElementById('location').value.trim(),
            estimator: document.getElementById('estimator').value.trim(),
            deadline: document.getElementById('deadline').value,
            status: document.getElementById('status').value,
            description: document.getElementById('description').value.trim()
        };

        // Validation
        if (!jobData.projectName || !jobData.clientName || !jobData.location || 
            !jobData.estimator || !jobData.deadline || !jobData.status) {
            alert('Please fill in all required fields.');
            return;
        }

        if (this.currentEditId) {
            // Edit existing job
            const jobIndex = this.jobs.findIndex(job => job.id === this.currentEditId);
            if (jobIndex !== -1) {
                this.jobs[jobIndex] = { ...this.jobs[jobIndex], ...jobData };
            }
        } else {
            // Add new job
            jobData.id = Date.now();
            this.jobs.push(jobData);
        }

        this.saveData();
        this.updateDisplay();
        this.populateEstimatorFilter();
        this.closeJobModal();
        
        const action = this.currentEditId ? 'updated' : 'added';
        this.showNotification(`Job ${action} successfully!`);
    }

    deleteJob(id) {
        if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            this.jobs = this.jobs.filter(job => job.id !== id);
            this.saveData();
            this.updateDisplay();
            this.populateEstimatorFilter();
            this.showNotification('Job deleted successfully!');
        }
    }

    // Search and Filter
    handleSearch(query) {
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
        const statusFilter = document.getElementById('statusFilter').value;
        const estimatorFilter = document.getElementById('estimatorFilter').value;

        this.filteredJobs = this.jobs.filter(job => {
            const matchesSearch = !searchQuery || 
                job.projectName.toLowerCase().includes(searchQuery) ||
                job.clientName.toLowerCase().includes(searchQuery) ||
                job.location.toLowerCase().includes(searchQuery);
            
            const matchesStatus = !statusFilter || job.status === statusFilter;
            const matchesEstimator = !estimatorFilter || job.estimator === estimatorFilter;

            return matchesSearch && matchesStatus && matchesEstimator;
        });

        this.updateJobsDisplay();
        this.updateStats();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('estimatorFilter').value = '';
        this.applyFilters();
    }

    populateEstimatorFilter() {
        const estimatorFilter = document.getElementById('estimatorFilter');
        const estimators = [...new Set(this.jobs.map(job => job.estimator))].sort();
        
        // Clear existing options except the first one
        while (estimatorFilter.children.length > 1) {
            estimatorFilter.removeChild(estimatorFilter.lastChild);
        }
        
        estimators.forEach(estimator => {
            const option = document.createElement('option');
            option.value = estimator;
            option.textContent = estimator;
            estimatorFilter.appendChild(option);
        });
    }

    // Display Management
    updateDisplay() {
        this.filteredJobs = [...this.jobs];
        this.updateStats();
        this.updateJobsDisplay();
    }

    updateStats() {
        const total = this.filteredJobs.length;
        const inProgress = this.filteredJobs.filter(job => job.status === 'In Progress').length;
        const submitted = this.filteredJobs.filter(job => job.status === 'Submitted').length;
        const overdue = this.filteredJobs.filter(job => this.isOverdue(job.deadline)).length;

        document.getElementById('totalJobs').textContent = total;
        document.getElementById('inProgressJobs').textContent = inProgress;
        document.getElementById('submittedJobs').textContent = submitted;
        document.getElementById('overdueJobs').textContent = overdue;
    }

    updateJobsDisplay() {
        if (this.filteredJobs.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
            if (this.currentView === 'table') {
                this.renderTableView();
            } else {
                this.renderCardView();
            }
        }
    }

    renderTableView() {
        const tbody = document.getElementById('jobsTableBody');
        tbody.innerHTML = '';

        this.filteredJobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="font-weight-500">${this.escapeHtml(job.projectName)}</div>
                    ${job.description ? `<div class="text-sm text-muted mt-1">${this.escapeHtml(job.description)}</div>` : ''}
                </td>
                <td>${this.escapeHtml(job.clientName)}</td>
                <td>${this.escapeHtml(job.location)}</td>
                <td>${this.escapeHtml(job.estimator)}</td>
                <td>
                    <div class="deadline">
                        <div class="deadline-date">${this.formatDate(job.deadline)}</div>
                        <div class="deadline-countdown ${this.getDeadlineClass(job.deadline)}">
                            ${this.getDeadlineText(job.deadline)}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(job.status)}">
                        ${job.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="dashboard.openJobModal(${JSON.stringify(job).replace(/"/g, '&quot;')})" title="Edit">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" onclick="dashboard.deleteJob(${job.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCardView() {
        const container = document.getElementById('jobsCardsGrid');
        container.innerHTML = '';

        this.filteredJobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card fade-in';
            card.innerHTML = `
                <div class="job-card-header">
                    <div>
                        <div class="job-card-title">${this.escapeHtml(job.projectName)}</div>
                        <div class="job-card-client">${this.escapeHtml(job.clientName)}</div>
                    </div>
                    <span class="status-badge ${this.getStatusClass(job.status)}">
                        ${job.status}
                    </span>
                </div>
                
                <div class="job-card-details">
                    <div class="job-card-detail">
                        <span class="detail-icon">📍</span>
                        <span>${this.escapeHtml(job.location)}</span>
                    </div>
                    <div class="job-card-detail">
                        <span class="detail-icon">👤</span>
                        <span>${this.escapeHtml(job.estimator)}</span>
                    </div>
                    <div class="job-card-detail">
                        <span class="detail-icon">📅</span>
                        <span>
                            ${this.formatDate(job.deadline)}
                            <span class="deadline-countdown ${this.getDeadlineClass(job.deadline)}">
                                (${this.getDeadlineText(job.deadline)})
                            </span>
                        </span>
                    </div>
                    ${job.description ? `
                        <div class="job-card-detail">
                            <span class="detail-icon">📝</span>
                            <span>${this.escapeHtml(job.description)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="job-card-footer">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="dashboard.openJobModal(${JSON.stringify(job).replace(/"/g, '&quot;')})" title="Edit">
                            ✏️ Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="dashboard.deleteJob(${job.id})" title="Delete">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('cardView').style.display = 'none';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
        if (this.currentView === 'table') {
            document.getElementById('tableView').style.display = 'block';
            document.getElementById('cardView').style.display = 'none';
        } else {
            document.getElementById('tableView').style.display = 'none';
            document.getElementById('cardView').style.display = 'block';
        }
    }

    switchView(view) {
        this.currentView = view;
        
        document.getElementById('tableViewBtn').classList.toggle('active', view === 'table');
        document.getElementById('cardViewBtn').classList.toggle('active', view === 'card');
        
        this.updateJobsDisplay();
    }

    // Export Functionality
    openExportModal() {
        document.getElementById('exportModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeExportModal() {
        document.getElementById('exportModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    performExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const dataSelection = document.querySelector('input[name="exportData"]:checked').value;
        
        const exportData = dataSelection === 'all' ? this.jobs : this.filteredJobs;
        
        if (format === 'csv') {
            this.exportToCSV(exportData);
        } else {
            this.exportToPDF(exportData);
        }
        
        this.closeExportModal();
    }

    exportToCSV(data) {
        const headers = ['Project Name', 'Client', 'Location', 'Estimator', 'Deadline', 'Status', 'Description'];
        const csvContent = [
            headers.join(','),
            ...data.map(job => [
                `"${job.projectName}"`,
                `"${job.clientName}"`,
                `"${job.location}"`,
                `"${job.estimator}"`,
                job.deadline,
                `"${job.status}"`,
                `"${job.description || ''}"`
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'construction-bids.csv', 'text/csv');
    }

    exportToPDF(data) {
        // Simple PDF export using HTML and print styles
        const printWindow = window.open('', '_blank');
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>MH Construction - Bid Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4a5d23; padding-bottom: 10px; }
                    .logo { color: #4a5d23; font-size: 24px; margin-bottom: 5px; }
                    .subtitle { color: #666; font-size: 14px; }
                    .meta { margin-bottom: 20px; font-size: 12px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .status { padding: 2px 6px; border-radius: 3px; font-size: 10px; }
                    .status-in-progress { background: #e3f2fd; color: #1976d2; }
                    .status-submitted { background: #f3e5f5; color: #7b1fa2; }
                    .status-follow-up-required { background: #fff3e0; color: #f57c00; }
                    .status-won { background: #e8f5e8; color: #388e3c; }
                    .status-lost { background: #ffebee; color: #d32f2f; }
                    .status-no-bid { background: #f5f5f5; color: #616161; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">MH Construction</div>
                    <div class="subtitle">Bid Tracking Report</div>
                </div>
                <div class="meta">
                    Generated on: ${new Date().toLocaleDateString()}<br>
                    Total Records: ${data.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Project Name</th>
                            <th>Client</th>
                            <th>Location</th>
                            <th>Estimator</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(job => `
                            <tr>
                                <td>${this.escapeHtml(job.projectName)}</td>
                                <td>${this.escapeHtml(job.clientName)}</td>
                                <td>${this.escapeHtml(job.location)}</td>
                                <td>${this.escapeHtml(job.estimator)}</td>
                                <td>${this.formatDate(job.deadline)}</td>
                                <td><span class="status ${this.getStatusClass(job.status)}">${job.status}</span></td>
                                <td>${this.escapeHtml(job.description || '')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getDeadlineText(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return '1 day left';
        } else if (diffDays <= 7) {
            return `${diffDays} days left`;
        } else {
            return `${diffDays} days left`;
        }
    }

    getDeadlineClass(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'deadline-overdue';
        } else if (diffDays <= 3) {
            return 'deadline-urgent';
        }
        return '';
    }

    isOverdue(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        return deadlineDate < today;
    }

    getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Simple notification - you could enhance this with a proper notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global functions for onclick handlers
function openJobModal() {
    dashboard.openJobModal();
}

function closeJobModal() {
    dashboard.closeJobModal();
}

function saveJob() {
    dashboard.saveJob();
}

function closeExportModal() {
    dashboard.closeExportModal();
}

function performExport() {
    dashboard.performExport();
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new BidTrackingDashboard();
});