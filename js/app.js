// Bid Tracking Dashboard - Complete Application Implementation

class BidTrackingDashboard {
    constructor() {
        this.jobs = [];
        this.estimators = [];
        this.filteredJobs = [];
        this.currentEditId = null;
        this.currentView = 'table';
        this.authComponent = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        try {
            console.log('🚀 Initializing Bid Tracking Dashboard...');
            
            // Wait for all dependencies to load
            await this.waitForDependencies();
            
            // Initialize Firebase service
            await window.firebaseService.init();
            
            // Override Firebase auth state change handler
            window.firebaseService.onAuthStateChange = (user) => this.handleAuthStateChange(user);
            
            // Initialize auth component
            this.authComponent = new window.AuthComponent();
            
            // Bind all event handlers
            this.bindEvents();
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showNotification('Failed to initialize application: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const checkDependencies = () => {
                console.log(`Checking dependencies, attempt ${attempts + 1}`);
                
                if (typeof firebase !== 'undefined' && 
                    typeof window.firebaseConfig !== 'undefined' &&
                    typeof window.AuthComponent !== 'undefined' &&
                    typeof window.firebaseService !== 'undefined') {
                    console.log('✅ All dependencies loaded successfully');
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkDependencies, 50);
                } else {
                    console.error('❌ Dependencies check failed:', {
                        firebase: typeof firebase,
                        firebaseConfig: typeof window.firebaseConfig,
                        AuthComponent: typeof window.AuthComponent,
                        firebaseService: typeof window.firebaseService
                    });
                    reject(new Error('Dependencies failed to load'));
                }
            };
            
            checkDependencies();
        });
    }

    showLoading(show) {
        let loadingOverlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loadingOverlay';
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p>Loading...</p>
                    </div>
                `;
                document.body.appendChild(loadingOverlay);
            }
            loadingOverlay.style.display = 'flex';
        } else {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    handleAuthStateChange(user) {
        if (user) {
            console.log('👤 User signed in:', user.displayName || user.email);
            this.authComponent.hide();
            this.loadData();
            this.setupRealtimeListeners();
        } else {
            console.log('👤 User signed out');
            this.authComponent.show();
            this.clearData();
            window.firebaseService.cleanup();
        }
        this.showLoading(false);
    }

    clearData() {
        this.jobs = [];
        this.estimators = [];
        this.filteredJobs = [];
        this.updateDisplay();
    }

    setupRealtimeListeners() {
        // Listen for real-time job updates
        window.firebaseService.subscribeToJobs((jobs, error) => {
            if (error) {
                this.showNotification('Error loading jobs: ' + error.message, 'error');
                return;
            }
            
            this.jobs = jobs || [];
            this.updateDisplay();
            this.populateEstimatorFilter();
        });
    }

    async loadData() {
        this.showLoading(true);
        
        try {
            console.log('📊 Loading data from Firebase...');
            
            // Load jobs and estimators from Firebase
            const [jobsResult, estimatorsResult] = await Promise.all([
                window.firebaseService.getJobs(),
                window.firebaseService.getEstimators()
            ]);

            if (jobsResult.success) {
                this.jobs = jobsResult.data;
                console.log(`✅ Loaded ${this.jobs.length} jobs`);
            } else {
                this.showNotification('Failed to load jobs: ' + jobsResult.error, 'error');
            }

            if (estimatorsResult.success) {
                this.estimators = estimatorsResult.data;
                console.log(`✅ Loaded ${this.estimators.length} estimators`);
            } else {
                // If no estimators exist, create default ones
                console.log('📝 Creating default estimators...');
                await this.createDefaultEstimators();
            }

            this.updateDisplay();
            this.populateEstimatorFilter();
            this.populateEstimatorOptions();
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            this.showNotification('Failed to load data: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async createDefaultEstimators() {
        const defaultEstimators = [
            { name: 'John Smith', email: 'john.smith@mhconstruction.com', active: true },
            { name: 'Sarah Johnson', email: 'sarah.johnson@mhconstruction.com', active: true },
            { name: 'Mike Wilson', email: 'mike.wilson@mhconstruction.com', active: true }
        ];

        for (const estimator of defaultEstimators) {
            await window.firebaseService.addEstimator(estimator);
        }

        const result = await window.firebaseService.getEstimators();
        if (result.success) {
            this.estimators = result.data;
        }
    }

    // Event Binding
    bindEvents() {
        console.log('🔗 Binding event handlers...');
        
        // Modal controls
        document.getElementById('addJobBtn').addEventListener('click', () => this.openJobModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());
        
        // Add sign out button event
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
        
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

    // Modal Management
    openJobModal(job = null) {
        this.currentEditId = job ? job.id : null;
        
        if (job) {
            // Populate form with job data for editing
            document.getElementById('projectName').value = job.projectName || '';
            document.getElementById('clientName').value = job.clientName || '';
            document.getElementById('location').value = job.location || '';
            document.getElementById('estimator').value = job.estimator || '';
            document.getElementById('deadline').value = job.deadline || '';
            document.getElementById('status').value = job.status || 'In Progress';
            document.getElementById('description').value = job.description || '';
            
            document.getElementById('modalTitle').textContent = 'Edit Job';
        } else {
            // Clear form for new job
            document.getElementById('jobForm').reset();
            document.getElementById('status').value = 'In Progress';
            document.getElementById('modalTitle').textContent = 'Add New Job';
        }
        
        document.getElementById('jobModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeJobModal() {
        document.getElementById('jobModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditId = null;
    }

    openExportModal() {
        document.getElementById('exportModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeExportModal() {
        document.getElementById('exportModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Job Management
    async saveJob() {
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
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let result;
            if (this.currentEditId) {
                result = await window.firebaseService.updateJob(this.currentEditId, jobData);
            } else {
                result = await window.firebaseService.addJob(jobData);
            }

            if (result.success) {
                const action = this.currentEditId ? 'updated' : 'added';
                this.showNotification(`Job ${action} successfully!`, 'success');
                this.closeJobModal();
            } else {
                this.showNotification('Failed to save job: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to save job: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteJob(id) {
        if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            return;
        }

        this.showLoading(true);

        try {
            const result = await window.firebaseService.deleteJob(id);
            
            if (result.success) {
                this.showNotification('Job deleted successfully!', 'success');
            } else {
                this.showNotification('Failed to delete job: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to delete job: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            this.showLoading(true);
            const result = await window.firebaseService.signOut();
            
            if (!result.success) {
                this.showNotification('Failed to sign out: ' + result.error, 'error');
                this.showLoading(false);
            }
        }
    }

    // Search and Filter Methods
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

    populateEstimatorOptions() {
        const estimatorSelect = document.getElementById('estimator');
        
        // Clear existing options except the first one
        while (estimatorSelect.children.length > 1) {
            estimatorSelect.removeChild(estimatorSelect.lastChild);
        }
        
        this.estimators.forEach(estimator => {
            const option = document.createElement('option');
            option.value = estimator.name;
            option.textContent = estimator.name;
            estimatorSelect.appendChild(option);
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
                        <button class="action-btn delete-btn" onclick="dashboard.deleteJob('${job.id}')" title="Delete">
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
                        <button class="action-btn delete-btn" onclick="dashboard.deleteJob('${job.id}')" title="Delete">
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

    // Export functionality
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
                                <td>${job.status}</td>
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
}

// Initialize the dashboard when dependencies are ready
let dashboard;

// Global functions for onclick handlers
window.openJobModal = () => dashboard?.openJobModal();
window.closeJobModal = () => dashboard?.closeJobModal();
window.saveJob = () => dashboard?.saveJob();
window.closeExportModal = () => dashboard?.closeExportModal();
window.performExport = () => dashboard?.performExport();
window.signOut = () => dashboard?.signOut();

// Initialize dashboard
console.log('📱 Creating dashboard instance...');
dashboard = new BidTrackingDashboard();

console.log('🎯 App.js loaded completely');