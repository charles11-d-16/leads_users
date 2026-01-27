let charts = {};
let inquiriesData = [];
let filteredData = [];
let startDate = null;
let endDate = null;
let selectedStatuses = ['New', 'Contacted', 'In Progress', 'Cancelled', 'Completed-Successful', 'Completed-Unsuccessful'];

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        primary: isDark ? '#43f3d0' : '#0d9488',
        secondary: isDark ? '#1fbfa1' : '#0f766e',
        muted: isDark ? '#9fbdb6' : '#5a7a75',
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        card: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        pie: isDark ? 
            ['#43f3d0', '#1fbfa1', '#147a67', '#0a3d33', '#047857'] : 
            ['#0d9488', '#14b8a6', '#5ba39d', '#8fbab5', '#065f46']
    };
}

async function fetchInquiries() {
    try {
        const response = await fetch('/api/inquiries');
        const data = await response.json();
        inquiriesData = data;
        filteredData = [...inquiriesData];
        
        // Set default 1-month filter
        setDefaultDateFilter();
        
        updateDashboard();
        setupSearchListener();
    } catch (err) {
        console.error('Error fetching inquiries:', err);
    }
}

function setDefaultDateFilter() {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    endDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    startDate = oneMonthAgo.getFullYear() + '-' + String(oneMonthAgo.getMonth() + 1).padStart(2, '0') + '-' + String(oneMonthAgo.getDate()).padStart(2, '0');
    
    // Apply default filter to filteredData
    applyFilterInternal();
}

function calculateStats(data = filteredData) {
    const stats = {
        New: 0,
        Contacted: 0,
        'In Progress': 0,
        'Completed-Successful': 0,
        'Completed-Unsuccessful': 0,
        Cancelled: 0
    };

    data.forEach(inq => {
        if (stats.hasOwnProperty(inq.status)) {
            stats[inq.status]++;
        }
    });

    return stats;
}

function updateStats() {
    const stats = calculateStats();
    const statCards = document.querySelectorAll('.stat-card');
    
    const total = stats['New'] + stats['Contacted'] + stats['In Progress'] + stats['Cancelled'] + (stats['Completed-Successful'] + stats['Completed-Unsuccessful']);
    
    const values = [
        stats['New'],
        stats['Contacted'],
        stats['In Progress'],
        stats['Cancelled'],
        stats['Completed-Successful'] + stats['Completed-Unsuccessful']
    ];
    
    values.forEach((value, index) => {
        const card = statCards[index];
        card.querySelector('.value').textContent = value;
        
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        const trendElement = card.querySelector('.trend');
        trendElement.textContent = '+' + percentage + '%';
    });
}

function updateCharts() {
    const stats = calculateStats();
    const colors = getThemeColors();
    
    // Destroy existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');

    // Line chart - daily data based on filtered date range
    let dataToUse = filteredData.length > 0 ? filteredData : inquiriesData;
    
    // Generate date range for x-axis
    const dateRange = [];
    const labels = [];
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
            dateRange.push(dateStr);
            labels.push(current.getDate() + '/' + (current.getMonth() + 1));
            current.setDate(current.getDate() + 1);
        }
    } else {
        labels.push('w1', 'w2', 'w3', 'w4');
        dateRange.push('w1', 'w2', 'w3', 'w4');
    }
    
    // Count inquiries per day
    const dayData = dateRange.map(date => {
        if (date.startsWith('w')) return 0;
        return dataToUse.filter(inq => {
            const inqDate = new Date(inq.inquiry_date);
            const inqDateStr = inqDate.getFullYear() + '-' + String(inqDate.getMonth() + 1).padStart(2, '0') + '-' + String(inqDate.getDate()).padStart(2, '0');
            return inqDateStr === date;
        }).length;
    });

    charts.line = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: dayData,
                borderColor: colors.primary,
                backgroundColor: colors.primary + '15',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: colors.grid }, 
                    ticks: { 
                        color: colors.muted, 
                        font: { size: 10 },
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    } 
                },
                x: { grid: { display: false }, ticks: { color: colors.muted, font: { size: 10 } } }
            }
        }
    });

    // Doughnut chart - successful vs unsuccessful
    const successful = stats['Completed-Successful'];
    const unsuccessful = stats['Completed-Unsuccessful'];
    const total = successful + unsuccessful || 1;
    const successPercent = ((successful / total) * 100).toFixed(1);
    const unsuccessPercent = ((unsuccessful / total) * 100).toFixed(1);

    charts.doughnut = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Unsuccessful'],
            datasets: [{
                data: [successPercent, unsuccessPercent],
                backgroundColor: [colors.primary, colors.card],
                borderColor: 'transparent',
                cutout: '82%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { color: colors.muted, boxWidth: 8, usePointStyle: true, font: { size: 10 } } 
                } 
            }
        }
    });

    document.getElementById('chartValue').textContent = successPercent + '%';

    // Pie chart - status distribution
    charts.pie = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['New', 'Contacted', 'In Progress', 'Completed', 'Cancelled'],
            datasets: [{
                data: [
                    stats['New'],
                    stats['Contacted'],
                    stats['In Progress'],
                    stats['Completed-Successful'] + stats['Completed-Unsuccessful'],
                    stats['Cancelled']
                ],
                backgroundColor: colors.pie,
                borderColor: 'transparent',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { color: colors.muted, boxWidth: 8, usePointStyle: true, font: { size: 10 }, padding: 15 } 
                }
            }
        }
    });
}

function populateTable(data = filteredData) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted);">No inquiries found</td></tr>';
        return;
    }
    
    data.forEach(inq => {
        const row = document.createElement('tr');
        const inquiryDate = new Date(inq.inquiry_date).toLocaleDateString();
        const statusClass = `status-${inq.status.toLowerCase().replace(/\s+|-/g, '-')}`;
        
        row.innerHTML = `
            <td style="color: var(--muted); font-family: monospace;">${inq.inquiry_id}</td>
            <td style="font-weight: 500;">${inq.full_name}</td>
            <td>${inq.email || '-'}</td>
            <td><span style="background: var(--input-bg); padding: 4px 8px; border-radius: 4px;">${inquiryDate}</span></td>
            <td><span class="status-pill ${statusClass}">${inq.status}</span></td>
            <td><i class="bi bi-three-dots" style="cursor: pointer;"></i></td>
        `;
        tbody.appendChild(row);
    });
}

function applyFilterInternal() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    filteredData = inquiriesData.filter(inq => {
        const inquiryDate = new Date(inq.inquiry_date);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        
        const matchesDateRange = inquiryDate >= filterStart && inquiryDate <= filterEnd;
        
        const matchesSearch = !searchQuery || (
            inq.full_name.toLowerCase().includes(searchQuery) ||
            inq.email.toLowerCase().includes(searchQuery) ||
            inq.inquiry_id.toLowerCase().includes(searchQuery) ||
            inq.message.toLowerCase().includes(searchQuery)
        );
        
        const matchesStatus = selectedStatuses.includes(inq.status);
        
        return matchesDateRange && matchesSearch && matchesStatus;
    });
    
    populateTable(filteredData);
    updateStats();
    updateCharts();
}

function updateDashboard() {
    updateStats();
    updateCharts();
    populateTable();
}

function toggleTheme() {
    const body = document.body;
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
    
    updateCharts();
    
    const colors = getThemeColors();
    document.getElementById('chartValue').style.color = colors.primary;
}

// Date Filter Functions
function openDateFilter() {
    const modal = document.getElementById('dateFilterModal');
    modal.classList.add('show');
    renderCalendars();
}

function closeDateFilter() {
    const modal = document.getElementById('dateFilterModal');
    modal.classList.remove('show');
}

function renderCalendars() {
    renderDatePicker('startDatePicker', startDate);
    renderDatePicker('endDatePicker', endDate);
}

function renderDatePicker(pickerId, selectedDate) {
    const picker = document.getElementById(pickerId);
    const today = new Date();
    const year = selectedDate ? new Date(selectedDate).getFullYear() : today.getFullYear();
    const month = selectedDate ? new Date(selectedDate).getMonth() : today.getMonth();
    
    let html = `
        <div class="calendar">
            <div class="calendar-header">
                <button onclick="changeMonth('${pickerId}', -1)">← Prev</button>
                <h4 id="${pickerId}-month">${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                <button onclick="changeMonth('${pickerId}', 1)">Next →</button>
            </div>
            <div class="calendar-weekdays">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>
            <div class="calendar-days" id="${pickerId}-days"></div>
        </div>
    `;
    
    if (pickerId === 'startDatePicker' && startDate) {
        html += `<div class="selected-date">Selected: ${new Date(startDate).toLocaleDateString()}</div>`;
    } else if (pickerId === 'endDatePicker' && endDate) {
        html += `<div class="selected-date">Selected: ${new Date(endDate).toLocaleDateString()}</div>`;
    }
    
    picker.innerHTML = html;
    
    const daysContainer = document.getElementById(`${pickerId}-days`);
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        const dateStr = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        
        if (pickerId === 'startDatePicker' && startDate === dateStr) {
            dayElement.classList.add('selected');
        } else if (pickerId === 'endDatePicker' && endDate === dateStr) {
            dayElement.classList.add('selected');
        }
        
        dayElement.onclick = () => selectDate(pickerId, dateStr);
        daysContainer.appendChild(dayElement);
    }
    
    // Next month days
    const totalCells = daysContainer.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        daysContainer.appendChild(dayElement);
    }
}

function changeMonth(pickerId, direction) {
    let currentDate = pickerId === 'startDatePicker' ? startDate : endDate;
    if (!currentDate) {
        const today = new Date();
        currentDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }
    
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + direction);
    
    // Re-render with new month
    setTimeout(() => renderDatePicker(pickerId, date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')), 0);
}

function selectDate(pickerId, dateStr) {
    if (pickerId === 'startDatePicker') {
        startDate = dateStr;
    } else {
        endDate = dateStr;
    }
    renderCalendars();
}

function applyDateFilter() {
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    applyFilterInternal();
    closeDateFilter();
}

function handleStatusAllChange() {
    const allCheckbox = document.getElementById('statusAll');
    const statusCheckboxes = [
        document.getElementById('statusNew'),
        document.getElementById('statusContacted'),
        document.getElementById('statusInProgress'),
        document.getElementById('statusCancelled'),
        document.getElementById('statusCompleted')
    ];
    
    if (allCheckbox.checked) {
        statusCheckboxes.forEach(cb => cb.checked = false);
        selectedStatuses = ['New', 'Contacted', 'In Progress', 'Cancelled', 'Completed-Successful', 'Completed-Unsuccessful'];
    } else {
        statusCheckboxes.forEach(cb => cb.checked = false);
        selectedStatuses = [];
    }
}

function handleStatusChange() {
    const allCheckbox = document.getElementById('statusAll');
    const statusCheckboxes = {
        statusNew: document.getElementById('statusNew'),
        statusContacted: document.getElementById('statusContacted'),
        statusInProgress: document.getElementById('statusInProgress'),
        statusCancelled: document.getElementById('statusCancelled'),
        statusCompleted: document.getElementById('statusCompleted')
    };
    
    const anyChecked = Object.values(statusCheckboxes).some(cb => cb.checked);
    
    if (!anyChecked) {
        allCheckbox.checked = true;
        selectedStatuses = ['New', 'Contacted', 'In Progress', 'Cancelled', 'Completed-Successful', 'Completed-Unsuccessful'];
        return;
    }
    
    allCheckbox.checked = false;
    
    selectedStatuses = [];
    if (statusCheckboxes.statusNew.checked) selectedStatuses.push('New');
    if (statusCheckboxes.statusContacted.checked) selectedStatuses.push('Contacted');
    if (statusCheckboxes.statusInProgress.checked) selectedStatuses.push('In Progress');
    if (statusCheckboxes.statusCancelled.checked) selectedStatuses.push('Cancelled');
    if (statusCheckboxes.statusCompleted.checked) {
        selectedStatuses.push('Completed-Successful');
        selectedStatuses.push('Completed-Unsuccessful');
    }
}

window.onload = fetchInquiries;