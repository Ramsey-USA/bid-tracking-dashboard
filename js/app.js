// Bid Tracking App - Main Application File

class BidTrackingApp {
    constructor() {
        this.jobs = [];
        this.estimators = [];
        this.currentEditingJobId = null;
        this.currentEditingEstimatorId = null;
        this.charts = {}; // Store chart instances
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            console.log('🚀 Starting app initialization...');
            
            // First setup event listeners
            this.setupEventListeners();
            this.setupViewToggle();
            this.setupChartsToggle();
            
            // Then initialize Firebase components
            await window.AuthComponent.init();
            await this.loadEstimators();
            await this.loadJobs();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    setupViewToggle() {
        const tableViewBtn = document.getElementById('tableViewBtn');
        const cardViewBtn = document.getElementById('cardViewBtn');
        const tableView = document.getElementById('tableView');
        const cardView = document.getElementById('cardView');
        
        if (tableViewBtn && cardViewBtn && tableView && cardView) {
            tableViewBtn.addEventListener('click', () => {
                tableViewBtn.classList.add('active');
                cardViewBtn.classList.remove('active');
                tableView.style.display = 'block';
                cardView.style.display = 'none';
            });
            
            cardViewBtn.addEventListener('click', () => {
                cardViewBtn.classList.add('active');
                tableViewBtn.classList.remove('active');
                tableView.style.display = 'none';
                cardView.style.display = 'block';
            });
            console.log('✅ View toggle setup complete');
        } else {
            console.error('❌ View toggle elements not found');
        }
    }

    setupChartsToggle() {
        const chartsToggle = document.getElementById('chartsToggle');
        const chartsSection = document.getElementById('chartsSection');
        
        if (chartsToggle && chartsSection) {
            chartsToggle.addEventListener('click', () => {
                const isCollapsed = chartsSection.style.display === 'none';
                chartsSection.style.display = isCollapsed ? 'block' : 'none';
                chartsToggle.textContent = isCollapsed ? '📊 Hide Charts' : '📊 Show Charts';
                
                if (isCollapsed) {
                    // Initialize charts when shown for the first time
                    setTimeout(() => this.initializeCharts(), 100);
                }
            });
            console.log('✅ Charts toggle setup complete');
        }
    }

    async loadEstimators() {
        try {
            this.estimators = await window.firebaseService.getEstimators();
        } catch (error) {
            this.estimators = [
                { id: '1', name: 'John Smith' },
                { id: '2', name: 'Sarah Johnson' },
                { id: '3', name: 'Mike Davis' }
            ];
        }
        this.populateEstimatorDropdowns();
    }

    populateEstimatorDropdowns() {
        const estimatorSelect = document.getElementById('estimator');
        const estimatorFilter = document.getElementById('estimatorFilter');
        
        if (estimatorSelect) {
            estimatorSelect.innerHTML = '<option value="">Select Estimator</option>';
            this.estimators.forEach(estimator => {
                const option = document.createElement('option');
                option.value = estimator.id;
                option.textContent = estimator.name;
                estimatorSelect.appendChild(option);
            });
        }

        if (estimatorFilter) {
            estimatorFilter.innerHTML = '<option value="">All Estimators</option>';
            this.estimators.forEach(estimator => {
                const option = document.createElement('option');
                option.value = estimator.name;
                option.textContent = estimator.name;
                estimatorFilter.appendChild(option);
            });
        }
    }

    async loadJobs() {
        try {
            this.jobs = await window.firebaseService.getJobs();
        } catch (error) {
            this.jobs = [];
        }
        this.renderJobs();
        this.updateStats();
        this.updateCharts();
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Add Job button
        const addJobBtn = document.getElementById('addJobBtn');
        if (addJobBtn) {
            addJobBtn.onclick = () => {
                console.log('Add Job clicked');
                this.openJobModal();
            };
            console.log('✅ Add Job button found and configured');
        } else {
            console.error('❌ Add Job button not found');
        }

        // Manage Estimators button
        const manageEstimatorsBtn = document.getElementById('manageEstimatorsBtn');
        if (manageEstimatorsBtn) {
            manageEstimatorsBtn.onclick = () => {
                console.log('Manage Estimators clicked');
                this.openEstimatorModal();
            };
            console.log('✅ Manage Estimators button found and configured');
        } else {
            console.error('❌ Manage Estimators button not found');
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                console.log('Export clicked');
                this.openExportModal();
            };
            console.log('✅ Export button found and configured');
        } else {
            console.error('❌ Export button not found');
        }

        // Sign Out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.onclick = () => {
                console.log('Sign Out clicked');
                window.AuthComponent.signOut();
            };
            console.log('✅ Sign Out button found and configured');
        } else {
            console.error('❌ Sign Out button not found');
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                console.log('Modal close clicked');
                this.closeAllModals();
            }
        });

        // Form handlers
        const jobForm = document.getElementById('jobForm');
        if (jobForm) {
            jobForm.onsubmit = (e) => {
                e.preventDefault();
                console.log('Job form submitted');
                this.saveJob();
            };
        }

        const estimatorForm = document.getElementById('estimatorForm');
        if (estimatorForm) {
            estimatorForm.onsubmit = (e) => {
                e.preventDefault();
                console.log('Estimator form submitted');
                this.saveEstimator();
            };
        }

        console.log('✅ Event listeners setup complete');
    }

    openJobModal(jobId = null) {
        console.log('📝 Opening job modal, jobId:', jobId);
        const modal = document.getElementById('jobModal');
        const title = document.getElementById('modalTitle');
        
        if (modal) {
            if (jobId) {
                if (title) title.textContent = 'Edit Job';
                this.currentEditingJobId = jobId;
                this.loadJobIntoForm(jobId);
            } else {
                if (title) title.textContent = 'Add New Job';
                this.currentEditingJobId = null;
                const form = document.getElementById('jobForm');
                if (form) form.reset();
            }
            modal.style.display = 'flex';
            console.log('✅ Job modal opened');
        } else {
            console.error('❌ Job modal not found');
        }
    }

    openEstimatorModal() {
        console.log('👥 Opening estimator modal');
        const modal = document.getElementById('estimatorModal');
        if (modal) {
            this.renderEstimatorList();
            this.resetEstimatorForm();
            modal.style.display = 'flex';
            console.log('✅ Estimator modal opened');
        } else {
            console.error('❌ Estimator modal not found');
        }
    }

    openExportModal() {
        console.log('📊 Opening export modal');
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Export modal opened');
        } else {
            console.error('❌ Export modal not found');
        }
    }

    closeAllModals() {
        console.log('🚪 Closing all modals');
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    loadJobIntoForm(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const fields = ['company', 'projectName', 'clientName', 'location', 'estimator', 'deadline', 'status', 'description', 'followUpDate'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = job[field] || '';
        });
    }

    async saveJob() {
        const jobData = {};
        const fields = ['company', 'projectName', 'clientName', 'location', 'estimator', 'deadline', 'status', 'description', 'followUpDate'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) jobData[field] = element.value.trim();
        });

        if (!jobData.company || !jobData.projectName || !jobData.clientName) {
            alert('Please fill in required fields.');
            return;
        }

        try {
            if (this.currentEditingJobId) {
                await window.firebaseService.updateJob(this.currentEditingJobId, jobData);
            } else {
                await window.firebaseService.addJob(jobData);
            }
            
            await this.loadJobs();
            this.closeAllModals();
        } catch (error) {
            alert('Failed to save job.');
        }
    }

    renderJobs() {
        const tbody = document.getElementById('jobsTableBody');
        const cardsGrid = document.getElementById('jobsCardsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!tbody) return;

        if (this.jobs.length === 0) {
            tbody.innerHTML = '';
            if (cardsGrid) cardsGrid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Populate table view (unchanged)
        tbody.innerHTML = this.jobs.map(job => `
            <tr>
                <td>
                    ${job.company ? `<span class="company-tag company-${job.company.toLowerCase()}">${job.company}</span>` : ''}
                    ${job.projectName || 'N/A'}
                </td>
                <td>${job.clientName || 'N/A'}</td>
                <td>${job.location || 'N/A'}</td>
                <td>${this.getEstimatorName(job.estimator) || 'N/A'}</td>
                <td>${this.formatDate(job.deadline) || 'N/A'}</td>
                <td><span class="status-badge status-${this.getStatusBadgeClass(job.status)}">${job.status || 'N/A'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="window.app.openJobModal('${job.id}')">✏️ Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteJob('${job.id}')">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Populate card view (with description)
        if (cardsGrid) {
            cardsGrid.innerHTML = this.jobs.map(job => `
                <div class="job-card">
                    <div class="job-card-header">
                        <div>
                            ${job.company ? `<span class="company-tag company-${job.company.toLowerCase()}">${job.company}</span>` : ''}
                            <div class="job-card-title">${job.projectName || 'N/A'}</div>
                            <div class="job-card-client">${job.clientName || 'N/A'}</div>
                        </div>
                        <span class="status-badge status-${this.getStatusBadgeClass(job.status)}">${job.status || 'N/A'}</span>
                    </div>
                    ${job.description ? `
                    <div class="job-card-description">
                        ${this.truncateText(job.description)}
                    </div>
                    ` : ''}
                    <div class="job-card-details">
                        <div class="job-card-detail">
                            <span class="detail-icon">📍</span>
                            <span>${job.location || 'N/A'}</span>
                        </div>
                        <div class="job-card-detail">
                            <span class="detail-icon">👤</span>
                            <span>${this.getEstimatorName(job.estimator) || 'N/A'}</span>
                        </div>
                        <div class="job-card-detail">
                            <span class="detail-icon">📅</span>
                            <span>Due: ${this.formatDate(job.deadline) || 'N/A'}</span>
                        </div>
                        ${job.followUpDate ? `
                        <div class="job-card-detail">
                            <span class="detail-icon">🔔</span>
                            <span>Follow up: ${this.formatDate(job.followUpDate)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="job-card-footer">
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="window.app.openJobModal('${job.id}')">✏️ Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="window.app.deleteJob('${job.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    getStatusBadgeClass(status) {
        if (!status) return '';
        return status.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    truncateText(text, maxLength = 80) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    getEstimatorName(estimatorId) {
        const estimator = this.estimators.find(e => e.id === estimatorId);
        return estimator ? estimator.name : estimatorId;
    }

    updateStats() {
        const stats = {
            totalJobs: this.jobs.length,
            inProgressJobs: this.jobs.filter(j => j.status === 'In Progress').length,
            submittedJobs: this.jobs.filter(j => j.status === 'Submitted').length,
            overdueJobs: this.jobs.filter(j => j.deadline && new Date(j.deadline) < new Date()).length
        };

        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.textContent = value;
        });
    }

    async deleteJob(jobId) {
        if (confirm('Delete this job?')) {
            try {
                await window.firebaseService.deleteJob(jobId);
                await this.loadJobs();
            } catch (error) {
                alert('Failed to delete job.');
            }
        }
    }

    renderEstimatorList() {
        const listContainer = document.getElementById('estimatorList');
        if (!listContainer) return;
        
        listContainer.innerHTML = this.estimators.map(estimator => `
            <div class="estimator-card">
                <div class="estimator-info">
                    <h4>${estimator.name}</h4>
                    <p>${estimator.email || ''} ${estimator.specialty || ''}</p>
                </div>
                <div class="estimator-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.app.editEstimator('${estimator.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteEstimator('${estimator.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    resetEstimatorForm() {
        const form = document.getElementById('estimatorForm');
        if (form) {
            form.reset();
            this.currentEditingEstimatorId = null;
        }
    }

    async saveEstimator() {
        const estimatorData = {
            name: '',
            email: '',
            phone: '',
            specialty: ''
        };
        
        const nameEl = document.getElementById('estimatorName');
        const emailEl = document.getElementById('estimatorEmail');
        const phoneEl = document.getElementById('estimatorPhone');
        const specialtyEl = document.getElementById('estimatorSpecialty');
        
        if (nameEl) estimatorData.name = nameEl.value.trim();
        if (emailEl) estimatorData.email = emailEl.value.trim();
        if (phoneEl) estimatorData.phone = phoneEl.value.trim();
        if (specialtyEl) estimatorData.specialty = specialtyEl.value;

        if (!estimatorData.name) {
            alert('Please enter a name.');
            return;
        }

        try {
            if (this.currentEditingEstimatorId) {
                await window.firebaseService.updateEstimator(this.currentEditingEstimatorId, estimatorData);
            } else {
                await window.firebaseService.addEstimator(estimatorData);
            }

            await this.loadEstimators();
            this.renderEstimatorList();
            this.resetEstimatorForm();
        } catch (error) {
            alert('Failed to save estimator.');
        }
    }

    editEstimator(estimatorId) {
        const estimator = this.estimators.find(e => e.id === estimatorId);
        if (!estimator) return;

        const nameEl = document.getElementById('estimatorName');
        const emailEl = document.getElementById('estimatorEmail');
        const phoneEl = document.getElementById('estimatorPhone');
        const specialtyEl = document.getElementById('estimatorSpecialty');

        if (nameEl) nameEl.value = estimator.name || '';
        if (emailEl) emailEl.value = estimator.email || '';
        if (phoneEl) phoneEl.value = estimator.phone || '';
        if (specialtyEl) specialtyEl.value = estimator.specialty || '';

        this.currentEditingEstimatorId = estimatorId;
    }

    async deleteEstimator(estimatorId) {
        if (confirm('Delete this estimator?')) {
            try {
                await window.firebaseService.deleteEstimator(estimatorId);
                await this.loadEstimators();
                this.renderEstimatorList();
            } catch (error) {
                alert('Failed to delete estimator.');
            }
        }
    }

    initializeCharts() {
        this.renderStatusChart();
        this.renderTrendsChart();
        this.renderWorkloadChart();
    }

    updateCharts() {
        // Only update if charts are visible
        const chartsSection = document.getElementById('chartsSection');
        if (chartsSection && chartsSection.style.display !== 'none') {
            this.renderStatusChart();
            this.renderTrendsChart();
            this.renderWorkloadChart();
        }
    }

    renderStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const statusCounts = {};
        this.jobs.forEach(job => {
            const status = job.status || 'No Status';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'
        ];

        this.charts.status = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Job Status Distribution'
                    }
                }
            }
        });
    }

    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        // Group jobs by month
        const monthlyData = {};
        this.jobs.forEach(job => {
            if (job.deadline) {
                const date = new Date(job.deadline);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });

        // Sort months and get last 6 months
        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const data = sortedMonths.map(month => monthlyData[month] || 0);

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jobs Due',
                    data: data,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Job Trends'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderWorkloadChart() {
        const ctx = document.getElementById('workloadChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.workload) {
            this.charts.workload.destroy();
        }

        const estimatorWorkload = {};
        this.estimators.forEach(estimator => {
            estimatorWorkload[estimator.name] = 0;
        });

        this.jobs.forEach(job => {
            const estimatorName = this.getEstimatorName(job.estimator);
            if (estimatorName && estimatorName !== job.estimator) {
                estimatorWorkload[estimatorName] = (estimatorWorkload[estimatorName] || 0) + 1;
            }
        });

        const labels = Object.keys(estimatorWorkload);
        const data = Object.values(estimatorWorkload);

        this.charts.workload = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jobs Assigned',
                    data: data,
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Estimator Workload'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

window.app = new BidTrackingApp();

window.openJobModal = (jobId) => window.app.openJobModal(jobId);
window.closeJobModal = () => window.app.closeAllModals();
window.saveJob = () => window.app.saveJob();
window.closeEstimatorModal = () => window.app.closeAllModals();
window.performExport = () => alert('Export feature coming soon!');