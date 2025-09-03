// Bid Tracking App - Main Application File

class BidTrackingApp {
    constructor() {
        this.jobs = [];
        this.estimators = [];
        this.currentEditingJobId = null;
        this.currentEditingEstimatorId = null;
        
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
            
            // Then initialize Firebase components
            await window.AuthComponent.init();
            await this.loadEstimators();
            await this.loadJobs();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
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

        const fields = ['projectName', 'clientName', 'location', 'estimator', 'deadline', 'status', 'description'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = job[field] || '';
        });
    }

    async saveJob() {
        const jobData = {};
        const fields = ['projectName', 'clientName', 'location', 'estimator', 'deadline', 'status', 'description'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) jobData[field] = element.value.trim();
        });

        if (!jobData.projectName || !jobData.clientName) {
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
        const emptyState = document.getElementById('emptyState');
        
        if (!tbody || !emptyState) return;

        if (this.jobs.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        tbody.innerHTML = this.jobs.map(job => `
            <tr>
                <td>${job.projectName || 'N/A'}</td>
                <td>${job.clientName || 'N/A'}</td>
                <td>${job.location || 'N/A'}</td>
                <td>${this.getEstimatorName(job.estimator) || 'N/A'}</td>
                <td>${job.deadline || 'N/A'}</td>
                <td><span class="status-badge">${job.status || 'N/A'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="window.app.openJobModal('${job.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteJob('${job.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
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
}

window.app = new BidTrackingApp();

window.openJobModal = (jobId) => window.app.openJobModal(jobId);
window.closeJobModal = () => window.app.closeAllModals();
window.saveJob = () => window.app.saveJob();
window.closeEstimatorModal = () => window.app.closeAllModals();
window.performExport = () => alert('Export feature coming soon!');