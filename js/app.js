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
        
        // Sync estimators with jobs after loading
        syncEstimatorsWithJobs();
        
        saveToLocalStorage();
        displayJobs();
        updateStatistics();
        updateCharts();
        
        console.log(`Loaded ${allJobs.length} jobs`);
    } catch (error) {
        console.error('Error loading jobs:', error);
        allJobs = getSampleJobs();
        filteredJobs = [...allJobs];
        syncEstimatorsWithJobs();
        displayJobs();
        updateStatistics();
    }
}

async function loadEstimators() {
    try {
        if (typeof FirebaseService !== 'undefined' && FirebaseService.getEstimators) {
            estimators = await FirebaseService.getEstimators();
        } else {
            // Load from local storage first, fallback to defaults
            const stored = localStorage.getItem(STORAGE_KEYS.ESTIMATORS);
            if (stored) {
                estimators = JSON.parse(stored);
                console.log('Loaded estimators from local storage:', estimators);
            } else {
                estimators = getDefaultEstimators();
                console.log('Using default estimators:', estimators);
                // Save defaults to local storage
                saveToLocalStorage();
            }
        }
        
        // Make sure estimators is an array
        if (!Array.isArray(estimators)) {
            console.warn('Estimators not an array, using defaults');
            estimators = getDefaultEstimators();
        }
        
        updateEstimatorDropdowns();
        console.log(`Loaded ${estimators.length} estimators:`, estimators);
    } catch (error) {
        console.error('Error loading estimators:', error);
        estimators = getDefaultEstimators();
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
            followUpDate: '2024-02-10',
            status: 'In Progress',
            bidAmount: 250000,
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
            followUpDate: '2024-02-18',
            status: 'Submitted',
            bidAmount: 180000,
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
            followUpDate: null,
            status: 'Won',
            bidAmount: 320000,
            createdAt: '2024-01-05T09:15:00Z'
        }
    ];
}

function getDefaultEstimators() {
    return [
        { id: '1', name: 'John Smith', email: 'john.smith@example.com' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
        { id: '3', name: 'Mike Davis', email: 'mike.davis@example.com' },
        { id: '4', name: 'Lisa Wilson', email: 'lisa.wilson@example.com' }
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
        const followUpNeeded = job.followUpDate && new Date(job.followUpDate) <= new Date() && job.status === 'In Progress';
        
        // Company badge
        const companyBadge = job.company === 'MHC' ? 
            '<span class="company-tag company-mhc">MHC</span>' : 
            '<span class="company-tag company-hdd">HDD</span>';
        
        // Follow-up indicator
        const followUpIndicator = followUpNeeded ? 
            '<span class="follow-up-indicator" title="Follow-up needed">🔔</span>' : '';
        
        // Format bid amount
        const bidAmountFormatted = job.bidAmount ? formatCurrency(job.bidAmount) : '<span class="text-muted">Not set</span>';
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>
                <div class="project-cell">
                    ${companyBadge}
                    <strong>${job.projectName}</strong>
                    ${followUpIndicator}
                </div>
            </td>
            <td>${job.clientName}</td>
            <td>${job.location}</td>
            <td>${job.estimator}</td>
            <td><strong>${bidAmountFormatted}</strong></td>
            <td class="${isOverdue ? 'overdue' : ''}">${formatDate(job.deadline)}</td>
            <td>${job.followUpDate ? formatDate(job.followUpDate) : '<span class="text-muted">None set</span>'}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(/\s+/g, '-')}">${job.status}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-outline" onclick="editJob('${job.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteJob('${job.id}')">Delete</button>
            </td>
        `;

        const card = document.createElement('div');
        card.className = `job-card ${job.company === 'MHC' ? 'mhc-card' : 'hdd-card'}`;
        card.innerHTML = `
            <div class="job-card-header">
                <div class="project-title-section">
                    ${companyBadge}
                    <h3>${job.projectName}</h3>
                    ${followUpIndicator}
                </div>
                <span class="status-badge status-${job.status.toLowerCase().replace(/\s+/g, '-')}">${job.status}</span>
            </div>
            <div class="job-card-body">
                <p><strong>Client:</strong> ${job.clientName}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Estimator:</strong> ${job.estimator}</p>
                <p><strong>Bid Amount:</strong> <span class="bid-amount">${bidAmountFormatted}</span></p>
                <p><strong>Deadline:</strong> <span class="${isOverdue ? 'overdue-text' : ''}">${formatDate(job.deadline)}</span></p>
                <p><strong>Follow-up:</strong> ${job.followUpDate ? 
                    `<span class="${followUpNeeded ? 'follow-up-needed' : ''}">${formatDate(job.followUpDate)}</span>` : 
                    '<span class="text-muted">None set</span>'}</p>
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

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Test if elements exist
    const elements = {
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        clearFilters: document.getElementById('clearFilters'),
        searchInput: document.getElementById('searchInput'),
        companyFilter: document.getElementById('companyFilter'),
        statusFilter: document.getElementById('statusFilter'),
        estimatorFilter: document.getElementById('estimatorFilter')
    };
    
    console.log('Filter elements found:', elements);
    
    // Filter events with debug logging
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', function() {
            console.log('Apply filters button clicked');
            applyFilters();
        });
    }
    
    if (elements.clearFilters) {
        elements.clearFilters.addEventListener('click', function() {
            console.log('Clear filters button clicked');
            clearAllFilters();
        });
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', function(e) {
            console.log('Search input changed:', e.target.value);
            applyFilters();
        });
    }
    
    if (elements.companyFilter) {
        elements.companyFilter.addEventListener('change', function(e) {
            console.log('Company filter changed:', e.target.value);
            applyFilters();
        });
    }
    
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', function(e) {
            console.log('Status filter changed:', e.target.value);
            applyFilters();
        });
    }
    
    if (elements.estimatorFilter) {
        elements.estimatorFilter.addEventListener('change', function(e) {
            console.log('Estimator filter changed:', e.target.value);
            applyFilters();
        });
    }
    
    // View toggle events
    document.getElementById('tableViewBtn')?.addEventListener('click', () => switchView('table'));
    document.getElementById('cardViewBtn')?.addEventListener('click', () => switchView('card'));
    
    // Header button events
    document.getElementById('addJobBtn')?.addEventListener('click', openJobModal);
    document.getElementById('manageEstimatorsBtn')?.addEventListener('click', openEstimatorsModal);
    document.getElementById('exportBtn')?.addEventListener('click', openExportModal);
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);

    // Modal events
    setupModalEvents();
}

function applyFilters() {
    console.log('=== APPLYING FILTERS ===');
    
    const searchInput = document.getElementById('searchInput');
    const companyFilter = document.getElementById('companyFilter');
    const statusFilter = document.getElementById('statusFilter');
    const estimatorFilter = document.getElementById('estimatorFilter');
    
    const searchTerm = searchInput?.value?.toLowerCase() || '';
    const companyFilterValue = companyFilter?.value || '';
    const statusFilterValue = statusFilter?.value || '';
    const estimatorFilterValue = estimatorFilter?.value || '';
    
    console.log('Filter values:', {
        search: searchTerm,
        company: companyFilterValue,
        status: statusFilterValue,
        estimator: estimatorFilterValue
    });
    
    console.log('All jobs before filtering:', allJobs);
    console.log('Available estimators:', estimators.map(e => e.name));
    
    filteredJobs = allJobs.filter(job => {
        // Ensure job properties exist before filtering
        const projectName = job.projectName || '';
        const clientName = job.clientName || '';
        const location = job.location || '';
        const company = job.company || '';
        const status = job.status || '';
        const estimator = job.estimator || '';

        const matchesSearch = !searchTerm || 
            projectName.toLowerCase().includes(searchTerm) ||
            clientName.toLowerCase().includes(searchTerm) ||
            location.toLowerCase().includes(searchTerm);
        
        const matchesCompany = !companyFilterValue || company === companyFilterValue;
        const matchesStatus = !statusFilterValue || status === statusFilterValue;
        
        // Fix estimator matching - trim whitespace and do exact match
        const matchesEstimator = !estimatorFilterValue || estimator.trim() === estimatorFilterValue.trim();

        const matches = matchesSearch && matchesCompany && matchesStatus && matchesEstimator;
        
        if (!matches) {
            console.log(`Job "${projectName}" filtered out:`, {
                estimatorInJob: `"${estimator}"`,
                estimatorFilter: `"${estimatorFilterValue}"`,
                matchesSearch,
                matchesCompany,
                matchesStatus,
                matchesEstimator
            });
        }

        return matches;
    });

    console.log(`Filtered ${filteredJobs.length} jobs from ${allJobs.length} total`);
    console.log('Filtered jobs:', filteredJobs);
    
    displayJobs(filteredJobs);
    updateStatistics(filteredJobs);
    updateCharts();
}

function clearAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const companyFilter = document.getElementById('companyFilter');
    const statusFilter = document.getElementById('statusFilter');
    const estimatorFilter = document.getElementById('estimatorFilter');
    
    if (searchInput) searchInput.value = '';
    if (companyFilter) companyFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (estimatorFilter) estimatorFilter.value = '';
    
    filteredJobs = [...allJobs];
    displayJobs();
    updateStatistics();
    updateCharts();
    
    console.log('Filters cleared, showing all jobs');
}

function updateStatistics(jobsToAnalyze = null) {
    const jobs = jobsToAnalyze || filteredJobs;
    const now = new Date();
    
    // Calculate combined totals
    const totalJobs = jobs.length;
    const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
    const submittedJobs = jobs.filter(job => job.status === 'Submitted').length;
    const overdueJobs = jobs.filter(job => 
        new Date(job.deadline) < now && 
        job.status !== 'Submitted' && 
        job.status !== 'Won' && 
        job.status !== 'Lost'
    ).length;
    const followUpNeeded = jobs.filter(job => 
        job.followUpDate && 
        new Date(job.followUpDate) <= now && 
        job.status === 'In Progress'
    ).length;

    // Calculate bid totals
    const totalBidValue = jobs.reduce((sum, job) => sum + (job.bidAmount || 0), 0);

    // Calculate MHC totals
    const mhcJobs = jobs.filter(job => job.company === 'MHC');
    const totalJobsMHC = mhcJobs.length;
    const inProgressJobsMHC = mhcJobs.filter(job => job.status === 'In Progress').length;
    const submittedJobsMHC = mhcJobs.filter(job => job.status === 'Submitted').length;
    const overdueJobsMHC = mhcJobs.filter(job => 
        new Date(job.deadline) < now && 
        job.status !== 'Submitted' && 
        job.status !== 'Won' && 
        job.status !== 'Lost'
    ).length;
    const followUpNeededMHC = mhcJobs.filter(job => 
        job.followUpDate && 
        new Date(job.followUpDate) <= now && 
        job.status === 'In Progress'
    ).length;
    const totalBidValueMHC = mhcJobs.reduce((sum, job) => sum + (job.bidAmount || 0), 0);

    // Calculate HDD totals
    const hddJobs = jobs.filter(job => job.company === 'HDD');
    const totalJobsHDD = hddJobs.length;
    const inProgressJobsHDD = hddJobs.filter(job => job.status === 'In Progress').length;
    const submittedJobsHDD = hddJobs.filter(job => job.status === 'Submitted').length;
    const overdueJobsHDD = hddJobs.filter(job => 
        new Date(job.deadline) < now && 
        job.status !== 'Submitted' && 
        job.status !== 'Won' && 
        job.status !== 'Lost'
    ).length;
    const followUpNeededHDD = hddJobs.filter(job => 
        job.followUpDate && 
        new Date(job.followUpDate) <= now && 
        job.status === 'In Progress'
    ).length;
    const totalBidValueHDD = hddJobs.reduce((sum, job) => sum + (job.bidAmount || 0), 0);

    // Update combined totals
    document.getElementById('totalJobs').textContent = totalJobs;
    document.getElementById('inProgressJobs').textContent = inProgressJobs;
    document.getElementById('submittedJobs').textContent = submittedJobs;
    document.getElementById('overdueJobs').textContent = overdueJobs;
    document.getElementById('followUpJobs').textContent = followUpNeeded;
    document.getElementById('totalBidValue').textContent = formatCurrency(totalBidValue);

    // Update MHC totals
    document.getElementById('totalJobsMHC').textContent = totalJobsMHC;
    document.getElementById('inProgressJobsMHC').textContent = inProgressJobsMHC;
    document.getElementById('submittedJobsMHC').textContent = submittedJobsMHC;
    document.getElementById('overdueJobsMHC').textContent = overdueJobsMHC;
    document.getElementById('followUpJobsMHC').textContent = followUpNeededMHC;
    document.getElementById('totalBidValueMHC').textContent = formatCurrency(totalBidValueMHC);

    // Update HDD totals
    document.getElementById('totalJobsHDD').textContent = totalJobsHDD;
    document.getElementById('inProgressJobsHDD').textContent = inProgressJobsHDD;
    document.getElementById('submittedJobsHDD').textContent = submittedJobsHDD;
    document.getElementById('overdueJobsHDD').textContent = overdueJobsHDD;
    document.getElementById('followUpJobsHDD').textContent = followUpNeededHDD;
    document.getElementById('totalBidValueHDD').textContent = formatCurrency(totalBidValueHDD);
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

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    charts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4CAF50', // Green for In Progress
                    '#2196F3', // Blue for Submitted  
                    '#FF9800', // Orange for On Hold
                    '#9C27B0', // Purple for RFQ/SOQ
                    '#4CAF50', // Green for Won
                    '#F44336', // Red for Lost
                    '#607D8B'  // Blue Grey for No Bid
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Jobs by Status',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function updateTrendsChart(jobs) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    // Group jobs by month from creation date or deadline
    const monthCounts = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    jobs.forEach(job => {
        const date = new Date(job.createdAt || job.deadline);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Create ordered data based on month order
    const orderedLabels = monthOrder.filter(month => monthCounts[month]);
    const orderedData = orderedLabels.map(month => monthCounts[month]);

    if (charts.trendsChart) {
        charts.trendsChart.destroy();
    }

    charts.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: orderedLabels,
            datasets: [{
                label: 'Jobs Created',
                data: orderedData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Job Creation Trends',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Number of Jobs'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
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

    const labels = Object.keys(estimatorCounts);
    const data = Object.values(estimatorCounts);

    charts.workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jobs Assigned',
                data: data,
                backgroundColor: '#2196F3',
                borderColor: '#1976D2',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Workload by Estimator',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Number of Jobs'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Estimators'
                    }
                }
            }
        }
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateEstimatorDropdowns() {
    const estimatorSelect = document.getElementById('estimator');
    const estimatorFilter = document.getElementById('estimatorFilter');
    
    // Make sure estimators is an array
    if (!Array.isArray(estimators)) {
        estimators = getDefaultEstimators();
    }
    
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

function setupModalEvents() {
    // Job modal events
    const jobModal = document.getElementById('jobModal');
    const jobForm = document.getElementById('jobForm');
    const cancelJobBtn = document.getElementById('cancelJobBtn');
    const modalClose = jobModal?.querySelector('.modal-close');

    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }

    if (cancelJobBtn) {
        cancelJobBtn.addEventListener('click', closeJobModal);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeJobModal);
    }

    // Close modal when clicking overlay
    if (jobModal) {
        jobModal.addEventListener('click', function(e) {
            if (e.target === jobModal) {
                closeJobModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeJobModal();
        }
    });
}

function openJobModal(editId = null) {
    const modal = document.getElementById('jobModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('jobForm');
    
    if (!modal || !form) return;

    currentEditId = editId;
    
    if (editId) {
        modalTitle.textContent = 'Edit Job';
        const job = allJobs.find(j => j.id === editId);
        if (job) {
            populateJobForm(job);
        }
    } else {
        modalTitle.textContent = 'Add New Job';
        form.reset();
        // Set default deadline to next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('deadline').value = nextWeek.toISOString().split('T')[0];
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentEditId = null;
        document.getElementById('jobForm')?.reset();
    }
}

function populateJobForm(job) {
    document.getElementById('company').value = job.company || '';
    document.getElementById('projectName').value = job.projectName || '';
    document.getElementById('clientName').value = job.clientName || '';
    document.getElementById('location').value = job.location || '';
    document.getElementById('estimator').value = job.estimator || '';
    document.getElementById('deadline').value = job.deadline || '';
    document.getElementById('followUpDate').value = job.followUpDate || '';
    document.getElementById('bidAmount').value = job.bidAmount || '';
    document.getElementById('status').value = job.status || '';
}

async function handleJobSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const jobData = {
        company: formData.get('company') || document.getElementById('company').value,
        projectName: formData.get('projectName') || document.getElementById('projectName').value,
        clientName: formData.get('clientName') || document.getElementById('clientName').value,
        location: formData.get('location') || document.getElementById('location').value,
        estimator: formData.get('estimator') || document.getElementById('estimator').value,
        deadline: formData.get('deadline') || document.getElementById('deadline').value,
        followUpDate: formData.get('followUpDate') || document.getElementById('followUpDate').value || null,
        bidAmount: parseFloat(formData.get('bidAmount') || document.getElementById('bidAmount').value) || null,
        status: formData.get('status') || document.getElementById('status').value
    };

    // Validate required fields
    const requiredFields = ['company', 'projectName', 'clientName', 'location', 'estimator', 'deadline', 'status'];
    const missingFields = requiredFields.filter(field => !jobData[field]);
    
    if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
    }

    try {
        if (currentEditId) {
            // Update existing job
            const jobIndex = allJobs.findIndex(job => job.id === currentEditId);
            if (jobIndex !== -1) {
                allJobs[jobIndex] = { ...allJobs[jobIndex], ...jobData };
                
                if (typeof FirebaseService !== 'undefined' && FirebaseService.isAvailable()) {
                    await FirebaseService.updateJob(currentEditId, jobData);
                }
            }
        } else {
            // Add new job
            const newJob = {
                id: Date.now().toString(),
                ...jobData,
                createdAt: new Date().toISOString()
            };
            
            if (typeof FirebaseService !== 'undefined' && FirebaseService.isAvailable()) {
                const savedJob = await FirebaseService.addJob(newJob);
                allJobs.push(savedJob);
            } else {
                allJobs.push(newJob);
            }
        }
        
        filteredJobs = [...allJobs];
        saveToLocalStorage();
        displayJobs();
        updateStatistics();
        updateCharts();
        closeJobModal();
        
        showNotification(currentEditId ? 'Job updated successfully!' : 'Job added successfully!', 'success');
    } catch (error) {
        console.error('Error saving job:', error);
        showNotification('Error saving job. Please try again.', 'error');
    }
}

function openEstimatorsModal() {
    const modal = document.getElementById('estimatorsModal');
    if (!modal) {
        createEstimatorsModal();
    }
    
    const estimatorsModal = document.getElementById('estimatorsModal');
    estimatorsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderEstimatorsList();
}

function createEstimatorsModal() {
    const modalHTML = `
    <div id="estimatorsModal" class="modal-overlay" style="display: none;">
        <div class="modal modal-large">
            <div class="modal-header">
                <h2>Manage Estimators</h2>
                <button class="modal-close" type="button" onclick="closeEstimatorsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="estimator-management">
                    <div class="estimator-form">
                        <h3>Add New Estimator</h3>
                        <form id="estimatorForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="estimatorName">Name *</label>
                                    <input type="text" id="estimatorName" required>
                                </div>
                                <div class="form-group">
                                    <label for="estimatorEmail">Email *</label>
                                    <input type="email" id="estimatorEmail" required>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Add Estimator</button>
                                <button type="button" class="btn btn-secondary" onclick="clearEstimatorForm()">Clear</button>
                            </div>
                        </form>
                    </div>
                    <div class="estimator-list">
                        <h3>Current Estimators</h3>
                        <div id="estimatorsContainer">
                            <!-- Estimators will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('estimatorForm').addEventListener('submit', handleEstimatorSubmit);
    
    // Close modal when clicking overlay
    document.getElementById('estimatorsModal').addEventListener('click', function(e) {
        if (e.target.id === 'estimatorsModal') {
            closeEstimatorsModal();
        }
    });
}

function closeEstimatorsModal() {
    const modal = document.getElementById('estimatorsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearEstimatorForm();
    }
}

function handleEstimatorSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('estimatorName').value.trim();
    const email = document.getElementById('estimatorEmail').value.trim();
    
    if (!name || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    // Check if estimator already exists
    const existingEstimator = estimators.find(est => 
        est.email.toLowerCase() === email.toLowerCase() || 
        est.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingEstimator) {
        alert('An estimator with this name or email already exists');
        return;
    }
    
    // Add new estimator
    const newEstimator = {
        id: Date.now().toString(),
        name: name,
        email: email
    };
    
    estimators.push(newEstimator);
    saveToLocalStorage();
    updateEstimatorDropdowns();
    renderEstimatorsList();
    clearEstimatorForm();
    
    showNotification('Estimator added successfully!', 'success');
}

function renderEstimatorsList() {
    const container = document.getElementById('estimatorsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (estimators.length === 0) {
        container.innerHTML = '<p>No estimators found. Add your first estimator above.</p>';
        return;
    }
    
    estimators.forEach(estimator => {
        const estimatorCard = document.createElement('div');
        estimatorCard.className = 'estimator-card';
        estimatorCard.innerHTML = `
            <div class="estimator-info">
                <h4>${estimator.name}</h4>
                <p>${estimator.email}</p>
            </div>
            <div class="estimator-actions">
                <button class="btn btn-small btn-outline" onclick="editEstimator('${estimator.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteEstimator('${estimator.id}')">Delete</button>
            </div>
        `;
        container.appendChild(estimatorCard);
    });
}

function editEstimator(id) {
    const estimator = estimators.find(est => est.id === id);
    if (!estimator) return;
    
    const newName = prompt('Enter new name:', estimator.name);
    if (newName === null) return; // User cancelled
    
    const newEmail = prompt('Enter new email:', estimator.email);
    if (newEmail === null) return; // User cancelled
    
    if (!newName.trim() || !newEmail.trim()) {
        alert('Name and email cannot be empty');
        return;
    }
    
    // Check if another estimator has the same name or email
    const existingEstimator = estimators.find(est => 
        est.id !== id && (
            est.email.toLowerCase() === newEmail.toLowerCase() || 
            est.name.toLowerCase() === newName.toLowerCase()
        )
    );
    
    if (existingEstimator) {
        alert('Another estimator with this name or email already exists');
        return;
    }
    
    // Update estimator
    const estimatorIndex = estimators.findIndex(est => est.id === id);
    estimators[estimatorIndex] = {
        ...estimator,
        name: newName.trim(),
        email: newEmail.trim()
    };
    
    saveToLocalStorage();
    updateEstimatorDropdowns();
    renderEstimatorsList();
    
    showNotification('Estimator updated successfully!', 'success');
}

function deleteEstimator(id) {
    const estimator = estimators.find(est => est.id === id);
    if (!estimator) return;
    
    // Check if estimator is assigned to any jobs
    const assignedJobs = allJobs.filter(job => job.estimator === estimator.name);
    
    if (assignedJobs.length > 0) {
        const confirmMsg = `This estimator is assigned to ${assignedJobs.length} job(s). Are you sure you want to delete them? The jobs will need to be reassigned.`;
        if (!confirm(confirmMsg)) return;
    } else {
        if (!confirm(`Are you sure you want to delete ${estimator.name}?`)) return;
    }
    
    // Remove estimator
    estimators = estimators.filter(est => est.id !== id);
    
    saveToLocalStorage();
    updateEstimatorDropdowns();
    renderEstimatorsList();
    
    showNotification('Estimator deleted successfully!', 'success');
    
    if (assignedJobs.length > 0) {
        showNotification(`${assignedJobs.length} job(s) need to be reassigned to other estimators`, 'warning');
    }
}

function openExportModal() {
    const csvData = generateCSV(filteredJobs);
    downloadCSV(csvData, 'bid-tracking-jobs.csv');
    showNotification('Data exported successfully!', 'success');
}

function generateCSV(jobs) {
    const headers = ['Project Name', 'Client', 'Location', 'Estimator', 'Bid Amount', 'Deadline', 'Status', 'Company', 'Created At'];
    const rows = jobs.map(job => [
        job.projectName,
        job.clientName,
        job.location,
        job.estimator,
        job.bidAmount || '',
        job.deadline,
        job.status,
        job.company === 'MHC' ? 'MH Construction' : 'High Desert Drywall',
        job.createdAt || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function handleSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
        if (window.authComponent) {
            window.authComponent.signOut();
        } else {
            // Clear local storage and reload
            localStorage.removeItem(STORAGE_KEYS.JOBS);
            localStorage.removeItem(STORAGE_KEYS.ESTIMATORS);
            location.reload();
        }
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        zIndex: '10000',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add missing clearEstimatorForm function
function clearEstimatorForm() {
    const form = document.getElementById('estimatorForm');
    if (form) {
        form.reset();
    }
}

// Add a function to sync estimators with existing jobs
function syncEstimatorsWithJobs() {
    console.log('Syncing estimators with jobs...');
    
    // Get unique estimators from jobs
    const jobEstimators = [...new Set(allJobs.map(job => job.estimator).filter(Boolean))];
    console.log('Estimators found in jobs:', jobEstimators);
    
    // Get existing estimator names
    const existingEstimatorNames = estimators.map(e => e.name);
    console.log('Existing estimators:', existingEstimatorNames);
    
    // Add missing estimators
    jobEstimators.forEach(jobEstimator => {
        if (!existingEstimatorNames.includes(jobEstimator)) {
            console.log(`Adding missing estimator: ${jobEstimator}`);
            const newEstimator = {
                id: Date.now().toString() + Math.random(),
                name: jobEstimator,
                email: `${jobEstimator.toLowerCase().replace(/\s+/g, '.')}@example.com`
            };
            estimators.push(newEstimator);
        }
    });
    
    // Save and update dropdowns
    saveToLocalStorage();
    updateEstimatorDropdowns();
    console.log('Updated estimators:', estimators);
}

// Export all necessary global functions
window.openJobModal = openJobModal;
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.debugDataState = debugDataState;
window.clearEstimatorForm = clearEstimatorForm;
window.editEstimator = editEstimator;
window.deleteEstimator = deleteEstimator;
window.closeEstimatorsModal = closeEstimatorsModal;

window.editJob = function(id) {
    openJobModal(id);
};

window.deleteJob = async function(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        try {
            if (typeof FirebaseService !== 'undefined' && FirebaseService.isAvailable()) {
                await FirebaseService.deleteJob(id);
            }
            
            allJobs = allJobs.filter(job => job.id !== id);
            filteredJobs = filteredJobs.filter(job => job.id !== id);
            saveToLocalStorage();
            displayJobs();
            updateStatistics();
            updateCharts();
            
            showNotification('Job deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting job:', error);
            showNotification('Error deleting job. Please try again.', 'error');
        }
    }
};

function switchView(viewType) {
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    const tableBtn = document.getElementById('tableViewBtn');
    const cardBtn = document.getElementById('cardViewBtn');
    
    if (!tableView || !cardView || !tableBtn || !cardBtn) {
        console.error('View elements not found');
        return;
    }
    
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
    
    console.log(`Switched to ${viewType} view`);
}