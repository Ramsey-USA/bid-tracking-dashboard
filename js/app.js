// Global variables
let allJobs = [];
let filteredJobs = [];
let estimators = [];
let currentEditId = null;
let charts = {};

const STORAGE_KEYS = {
    JOBS: 'mhc_jobs_backup',
    ESTIMATORS: 'mhc_estimators_backup'
};

// Debug function
function debugDataState() {
    console.log('=== DATA DEBUG ===');
    console.log('All Jobs:', allJobs);
    console.log('Filtered Jobs:', filteredJobs);
    console.log('Local Storage Jobs:', localStorage.getItem(STORAGE_KEYS.JOBS));
    console.log('Firebase Available:', typeof firebase !== 'undefined');
    console.log('FirebaseService Available:', typeof FirebaseService !== 'undefined');
    console.log('==================');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    initializeApp();
});

async function initializeApp() {
    try {
        await loadEstimators();
        await loadJobs();
        setupEventListeners();
        initializeCharts();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

async function loadJobs() {
    try {
        if (typeof FirebaseService !== 'undefined') {
            allJobs = await FirebaseService.getJobs();
        } else {
            const stored = localStorage.getItem(STORAGE_KEYS.JOBS);
            allJobs = stored ? JSON.parse(stored) : getSampleJobs();
        }
        
        filteredJobs = [...allJobs];
        saveToLocalStorage();
        displayJobs();
        updateStatistics();
        updateCharts();
        
        console.log(`Loaded ${allJobs.length} jobs`);
    } catch (error) {
        console.error('Error loading jobs:', error);
        allJobs = getSampleJobs();
        filteredJobs = [...allJobs];
        displayJobs();
        updateStatistics();
    }
}

async function loadEstimators() {
    try {
        if (typeof FirebaseService !== 'undefined') {
            estimators = await FirebaseService.getEstimators();
        } else {
            estimators = FirebaseService.getDefaultEstimators();
        }
        
        updateEstimatorDropdowns();
        console.log(`Loaded ${estimators.length} estimators`);
    } catch (error) {
        console.error('Error loading estimators:', error);
        estimators = FirebaseService.getDefaultEstimators();
        updateEstimatorDropdowns();
    }
}

function getSampleJobs() {
    return [
        {
            id: '1',
            company: 'MHC',
            projectName: 'Downtown Office Complex',
            clientName: 'ABC Development',
            location: 'Phoenix, AZ',
            estimator: 'John Smith',
            deadline: '2024-02-15',
            status: 'In Progress',
            createdAt: '2024-01-15T10:00:00Z'
        },
        {
            id: '2',
            company: 'HDD',
            projectName: 'Residential Towers Drywall',
            clientName: 'XYZ Homes',
            location: 'Scottsdale, AZ',
            estimator: 'Sarah Johnson',
            deadline: '2024-02-20',
            status: 'Submitted',
            createdAt: '2024-01-10T14:30:00Z'
        },
        {
            id: '3',
            company: 'MHC',
            projectName: 'Shopping Center Renovation',
            clientName: 'Retail Partners LLC',
            location: 'Mesa, AZ',
            estimator: 'Mike Davis',
            deadline: '2024-01-30',
            status: 'Won',
            createdAt: '2024-01-05T09:15:00Z'
        }
    ];
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(allJobs));
        localStorage.setItem(STORAGE_KEYS.ESTIMATORS, JSON.stringify(estimators));
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function displayJobs(jobsToDisplay = null) {
    const jobs = jobsToDisplay || filteredJobs;
    const tableBody = document.getElementById('jobsTableBody');
    const cardsGrid = document.getElementById('jobsCardsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!tableBody || !cardsGrid || !emptyState) return;

    tableBody.innerHTML = '';
    cardsGrid.innerHTML = '';

    if (jobs.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('cardView').style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';

    jobs.forEach(job => {
        const isOverdue = new Date(job.deadline) < new Date() && job.status !== 'Submitted' && job.status !== 'Won';
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td><strong>${job.projectName}</strong></td>
            <td>${job.clientName}</td>
            <td>${job.location}</td>
            <td>${job.estimator}</td>
            <td class="${isOverdue ? 'overdue' : ''}">${formatDate(job.deadline)}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(/\s+/g, '-')}">${job.status}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-outline" onclick="editJob('${job.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteJob('${job.id}')">Delete</button>
            </td>
        `;

        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <div class="job-card-header">
                <h3>${job.projectName}</h3>
                <span class="status-badge status-${job.status.toLowerCase().replace(/\s+/g, '-')}">${job.status}</span>
            </div>
            <div class="job-card-body">
                <p><strong>Client:</strong> ${job.clientName}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Estimator:</strong> ${job.estimator}</p>
                <p><strong>Deadline:</strong> ${formatDate(job.deadline)}</p>
                <p><strong>Company:</strong> ${job.company === 'MHC' ? 'MH Construction' : 'High Desert Drywall'}</p>
            </div>
            <div class="job-card-actions">
                <button class="btn btn-small btn-outline" onclick="editJob('${job.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteJob('${job.id}')">Delete</button>
            </div>
        `;
        cardsGrid.appendChild(card);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const companyFilter = document.getElementById('companyFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const estimatorFilter = document.getElementById('estimatorFilter').value;

    filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.projectName.toLowerCase().includes(searchTerm) ||
            job.clientName.toLowerCase().includes(searchTerm) ||
            job.location.toLowerCase().includes(searchTerm);
        
        const matchesCompany = !companyFilter || job.company === companyFilter;
        const matchesStatus = !statusFilter || job.status === statusFilter;
        const matchesEstimator = !estimatorFilter || job.estimator === estimatorFilter;

        return matchesSearch && matchesCompany && matchesStatus && matchesEstimator;
    });

    displayJobs(filteredJobs);
    updateStatistics(filteredJobs);
    updateCharts();
}

function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('companyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('estimatorFilter').value = '';
    
    filteredJobs = [...allJobs];
    displayJobs();
    updateStatistics();
    updateCharts();
}

function updateStatistics(jobsToAnalyze = null) {
    const jobs = jobsToAnalyze || filteredJobs;
    const now = new Date();
    
    const totalJobs = jobs.length;
    const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
    const submittedJobs = jobs.filter(job => job.status === 'Submitted').length;
    const overdueJobs = jobs.filter(job => 
        new Date(job.deadline) < now && 
        job.status !== 'Submitted' && 
        job.status !== 'Won' && 
        job.status !== 'Lost'
    ).length;

    document.getElementById('totalJobs').textContent = totalJobs;
    document.getElementById('inProgressJobs').textContent = inProgressJobs;
    document.getElementById('submittedJobs').textContent = submittedJobs;
    document.getElementById('overdueJobs').textContent = overdueJobs;
}

function initializeCharts() {
    const chartsToggle = document.getElementById('chartsToggle');
    const chartsSection = document.getElementById('chartsSection');
    
    if (chartsToggle && chartsSection) {
        chartsToggle.addEventListener('click', function() {
            const isVisible = chartsSection.style.display !== 'none';
            chartsSection.style.display = isVisible ? 'none' : 'block';
            chartsToggle.textContent = isVisible ? '📊 Show Charts' : '📊 Hide Charts';
            
            if (!isVisible) {
                setTimeout(() => updateCharts(), 100);
            }
        });
    }
}

function updateCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }

    const jobs = filteredJobs;
    updateStatusChart(jobs);
    updateTrendsChart(jobs);
    updateWorkloadChart(jobs);
}

function updateStatusChart(jobs) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const statusCounts = {};
    jobs.forEach(job => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    if (charts.statusChart) {
        charts.statusChart.destroy();
    }

    charts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#607D8B']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Jobs by Status'
                }
            }
        }
    });
}

function updateTrendsChart(jobs) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    const monthCounts = {};
    jobs.forEach(job => {
        const month = new Date(job.createdAt || job.deadline).toLocaleString('default', { month: 'short' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    if (charts.trendsChart) {
        charts.trendsChart.destroy();
    }

    charts.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthCounts),
            datasets: [{
                label: 'Jobs Created',
                data: Object.values(monthCounts),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Job Trends'
                }
            }
        }
    });
}

function updateWorkloadChart(jobs) {
    const ctx = document.getElementById('workloadChart');
    if (!ctx) return;

    const estimatorCounts = {};
    jobs.forEach(job => {
        estimatorCounts[job.estimator] = (estimatorCounts[job.estimator] || 0) + 1;
    });

    if (charts.workloadChart) {
        charts.workloadChart.destroy();
    }

    charts.workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(estimatorCounts),
            datasets: [{
                label: 'Jobs Assigned',
                data: Object.values(estimatorCounts),
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Workload by Estimator'
                }
            }
        }
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function updateEstimatorDropdowns() {
    const estimatorSelect = document.getElementById('estimator');
    const estimatorFilter = document.getElementById('estimatorFilter');
    
    if (estimatorSelect) {
        estimatorSelect.innerHTML = '<option value="">Select Estimator</option>';
        estimators.forEach(estimator => {
            estimatorSelect.innerHTML += `<option value="${estimator.name}">${estimator.name}</option>`;
        });
    }
    
    if (estimatorFilter) {
        const currentValue = estimatorFilter.value;
        estimatorFilter.innerHTML = '<option value="">All Estimators</option>';
        estimators.forEach(estimator => {
            estimatorFilter.innerHTML += `<option value="${estimator.name}">${estimator.name}</option>`;
        });
        estimatorFilter.value = currentValue;
    }
}

function setupEventListeners() {
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('companyFilter')?.addEventListener('change', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('estimatorFilter')?.addEventListener('change', applyFilters);
    
    document.getElementById('tableViewBtn')?.addEventListener('click', () => switchView('table'));
    document.getElementById('cardViewBtn')?.addEventListener('click', () => switchView('card'));
    
    document.getElementById('addJobBtn')?.addEventListener('click', openJobModal);
    document.getElementById('signOutBtn')?.addEventListener('click', () => {
        if (window.authComponent) {
            window.authComponent.signOut();
        }
    });
}

function switchView(viewType) {
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    const tableBtn = document.getElementById('tableViewBtn');
    const cardBtn = document.getElementById('cardViewBtn');
    
    if (viewType === 'table') {
        tableView.style.display = 'block';
        cardView.style.display = 'none';
        tableBtn.classList.add('active');
        cardBtn.classList.remove('active');
    } else {
        tableView.style.display = 'none';
        cardView.style.display = 'block';
        tableBtn.classList.remove('active');
        cardBtn.classList.add('active');
    }
}

function openJobModal() {
    console.log('Opening job modal...');
}

// Global functions
window.editJob = function(id) {
    console.log('Editing job:', id);
};

window.deleteJob = function(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        allJobs = allJobs.filter(job => job.id !== id);
        filteredJobs = filteredJobs.filter(job => job.id !== id);
        saveToLocalStorage();
        displayJobs();
        updateStatistics();
        updateCharts();
        console.log('Job deleted:', id);
    }
};

window.openJobModal = openJobModal;
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.debugDataState = debugDataState;