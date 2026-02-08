let charts = {};
let inquiriesData = [];
let filteredData = [];
let startDate = null;
let endDate = null;
let selectedStatuses = ['New', 'Contacted', 'In Progress', 'Cancelled', 'Completed-Successful', 'Completed-Unsuccessful'];

function showModalMessage(text, reload = false) {
    const modal = document.getElementById('messageModal');
    const messageText = document.getElementById('messageText');
    const closeBtn = document.getElementById('closeMessageModal');
    const okBtn = document.getElementById('okMessageButton');

    messageText.textContent = text;
    modal.style.display = 'block';

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        if (reload) location.reload();
    };
    okBtn.onclick = () => {
        modal.style.display = 'none';
        if (reload) location.reload();
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (reload) location.reload();
        }
    };
}

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

function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilterInternal();
        });
    }
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
        showModalMessage('Please select both start and end dates');
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

let importedData = [];
let currentPage = 1;
const rowsPerPage = 10;

function openImportModal() {
    // Show import choice modal first
    document.getElementById('importChoiceModal').style.display = 'block';
}

function closeImportChoice() {
    document.getElementById('importChoiceModal').style.display = 'none';
}

function chooseSingleImport() {
    closeImportChoice();
    document.getElementById('singleImportModal').style.display = 'block';
    document.getElementById('singleImportForm').reset();
}

function closeSingleImport() {
    document.getElementById('singleImportModal').style.display = 'none';
    document.getElementById('singleImportForm').reset();
}

function chooseBulkImport() {
    closeImportChoice();
    // Open the bulk import modal
    document.getElementById('importModal').style.display = 'block';
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
    importedData = [];
    
    // Attach browse button listener
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.onclick = function() {
            document.getElementById('importFile').click();
        };
    }
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
    resetImport();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log('File read successfully, size:', e.target.result.byteLength);
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            console.log('Parsed Excel data rows:', jsonData.length);
            console.log('First row:', jsonData[0]);
            console.log('Headers:', Object.keys(jsonData[0] || {}));

            // Validate and process data
            if (jsonData.length === 0) {
                showModalMessage('No data found in the file');
                return;
            }

            // Get the actual headers from the file
            const actualHeaders = Object.keys(jsonData[0] || {});
            const normalizeHeader = (h) => h.toLowerCase().trim().replace(/\s+/g, ' ');
            
            const actualNormalized = actualHeaders.map(normalizeHeader);
            
            console.log('Actual headers found:', actualHeaders);
            console.log('Normalized headers:', actualNormalized);
            
            // Check if we have at least the minimum required columns
            const hasFullName = actualNormalized.some(h => h.includes('full') && h.includes('name'));
            const hasEmail = actualNormalized.some(h => h.includes('email'));
            const hasInquiry = actualNormalized.some(h => h.includes('inquiry') || h.includes('concern'));
            const hasDiscovered = actualNormalized.some(h => h.includes('discover') || h.includes('via') || h.includes('platform'));
            
            console.log('Column checks:');
            console.log('  Full Name:', hasFullName, '- Looking for columns with "full" and "name"');
            console.log('  Email:', hasEmail, '- Looking for columns with "email"');
            console.log('  Inquiry:', hasInquiry, '- Looking for columns with "inquiry" or "concern"');
            console.log('  Discovered:', hasDiscovered, '- Looking for columns with "discover" or "via" or "platform"');
            
            if (!hasFullName || !hasEmail || !hasInquiry || !hasDiscovered) {
                const missing = [];
                if (!hasFullName) missing.push('Full Name');
                if (!hasEmail) missing.push('Email Address');
                if (!hasInquiry) missing.push('Inquiry');
                if (!hasDiscovered) missing.push('Discovered Via');
                
                showModalMessage('Invalid file format!\n\n❌ Missing required columns: ' + missing.join(', ') +
                      '\n\n✓ Required columns:\n' +
                      '  • Full Name\n' +
                      '  • Email Address\n' +
                      '  • Inquiry\n' +
                      '  • Discovered Via\n\n' +
                      '📋 Your file has: ' + actualHeaders.join(', '));
                document.getElementById('importFile').value = '';
                return;
            }

            // Map data with flexible column name matching
            importedData = jsonData.map(row => {
                // Find matching columns with better matching logic
                const findValue = (headers, searchTerms) => {
                    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
                    
                    // First try exact match (case-insensitive)
                    for (const header of headers) {
                        const normalized = header.toLowerCase().trim();
                        for (const term of terms) {
                            if (normalized === term.toLowerCase()) {
                                return row[header] || '';
                            }
                        }
                    }
                    
                    // Then try partial match
                    for (const header of headers) {
                        const normalized = header.toLowerCase().trim();
                        for (const term of terms) {
                            if (normalized.includes(term.toLowerCase())) {
                                return row[header] || '';
                            }
                        }
                    }
                    return '';
                };

                const mappedRow = {
                    full_name: findValue(actualHeaders, ['full name', 'fullname', 'name']) || '',
                    email: findValue(actualHeaders, ['email', 'email address']) || '',
                    phone: findValue(actualHeaders, ['phone', 'phone number', 'mobile']) || '',
                    company: findValue(actualHeaders, ['company', 'organization', 'business']) || '',
                    address: findValue(actualHeaders, ['address', 'location', 'street', 'city']) || '',
                    message: '', // Message will be empty, can be filled manually
                    concern_type: findValue(actualHeaders, ['inquiry', 'concern', 'type', 'subject']) || 'General Inquiry',
                    discovery_platform: findValue(actualHeaders, ['discovered', 'discover', 'via', 'platform', 'source']) || 'Other'
                };
                
                // Debug log to show mapping
                console.log('Row mapping:', {
                    headers: actualHeaders,
                    email_value: mappedRow.email,
                    address_value: mappedRow.address
                });
                
                return mappedRow;
            }).filter(item => item.full_name.trim() !== '' || item.email.trim() !== '');

            console.log('Processed import data:', importedData);
            console.log('Valid records count:', importedData.length);

            if (importedData.length === 0) {
                showModalMessage('No valid data found. Please ensure at least Full Name or Email Address is filled.');
                document.getElementById('importFile').value = '';
                return;
            }

            showModalMessage(`Found ${importedData.length} valid records to import!`);
            showImportPreview();
        } catch (error) {
            console.error('File upload error:', error);
            showModalMessage('Error reading file: ' + error.message);
            document.getElementById('importFile').value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

function showImportPreview() {
    const previewDiv = document.getElementById('importPreview');
    previewDiv.innerHTML = '';
    
    currentPage = 1;

    if (importedData.length === 0) {
        previewDiv.innerHTML = '<p style="color: var(--muted);">No data to preview</p>';
        document.getElementById('importPagination').style.display = 'none';
        return;
    }

    renderPreviewPage();
    document.getElementById('importStep1').style.display = 'none';
    document.getElementById('importStep2').style.display = 'block';
}

function renderPreviewPage() {
    const previewDiv = document.getElementById('importPreview');
    previewDiv.innerHTML = '';

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const pageData = importedData.slice(startIdx, endIdx);
    
    const totalPages = Math.ceil(importedData.length / rowsPerPage);

    // Create a table preview with all columns
    let table = '<table>';
    table += '<thead><tr>';
    table += '<th>Name</th>';
    table += '<th>Email</th>';
    table += '<th>Phone</th>';
    table += '<th>Company</th>';
    table += '<th>Address</th>';
    table += '<th>Discovered Via</th>';
    table += '<th>Inquiry</th>';
    table += '</tr></thead>';
    table += '<tbody>';
    
    pageData.forEach(row => {
        table += `<tr>
            <td style="font-weight: 500;">${row.full_name || '-'}</td>
            <td style="color: var(--muted);">${row.email || '-'}</td>
            <td>${row.phone || '-'}</td>
            <td>${row.company || '-'}</td>
            <td>${row.address || '-'}</td>
            <td>${row.discovery_platform || '-'}</td>
            <td>${row.concern_type || '-'}</td>
        </tr>`;
    });
    
    table += '</tbody></table>';
    previewDiv.innerHTML = table;
    
    // Update pagination
    const paginationDiv = document.getElementById('importPagination');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    if (importedData.length > rowsPerPage) {
        paginationDiv.style.display = 'flex';
    } else {
        paginationDiv.style.display = 'none';
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPreviewPage();
    }
}

function nextPage() {
    const totalPages = Math.ceil(importedData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderPreviewPage();
    }
}

function resetImport() {
    document.getElementById('importFile').value = '';
    importedData = [];
    currentPage = 1;
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importPreview').innerHTML = '';
    document.getElementById('importPagination').style.display = 'none';
}

async function submitImport() {
    if (importedData.length === 0) {
        showModalMessage('No data to import');
        return;
    }

    console.log('Submitting import with data:', importedData);

    try {
        const response = await fetch('/api/inquiries/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inquiries: importedData })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const error = await response.json();
            console.error('Server error:', error);
            throw new Error(error.error || 'Failed to import inquiries');
        }

        const result = await response.json();
        console.log('Import result:', result);
        showModalMessage(`Successfully imported ${result.imported} inquiries!`, true);
        closeImportModal();
    } catch (error) {
        console.error('Import error:', error);
        showModalMessage('Error: ' + error.message);
    }
}

// Single Import Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const singleImportForm = document.getElementById('singleImportForm');
    if (singleImportForm) {
        singleImportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const inquiry = {
                full_name: document.getElementById('singleFullName').value.trim(),
                email: document.getElementById('singleEmail').value.trim(),
                phone: document.getElementById('singlePhone').value.trim(),
                company: document.getElementById('singleCompany').value.trim(),
                address: document.getElementById('singleAddress').value.trim(),
                message: 'Added via single import',
                concern_type: document.getElementById('singleInquiryType').value,
                discovery_platform: document.getElementById('singleDiscoveredVia').value
            };

            // Validate required fields
            if (!inquiry.full_name || !inquiry.email || !inquiry.concern_type || !inquiry.discovery_platform) {
                showModalMessage('Please fill in all required fields (Full Name, Email, Discovered Via, and Inquiry Type)');
                return;
            }

            try {
                const response = await fetch('/api/inquiries/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inquiries: [inquiry] })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to add inquiry');
                }

                const result = await response.json();
                showModalMessage('Inquiry added successfully!', true);
                closeSingleImport();
            } catch (error) {
                console.error('Error adding inquiry:', error);
                showModalMessage('Error: ' + error.message);
            }
        });
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const importModal = document.getElementById('importModal');
    const importChoiceModal = document.getElementById('importChoiceModal');
    const singleImportModal = document.getElementById('singleImportModal');
    
    if (event.target == importModal) {
        closeImportModal();
    }
    if (event.target == importChoiceModal) {
        closeImportChoice();
    }
    if (event.target == singleImportModal) {
        closeSingleImport();
    }
});

window.onload = fetchInquiries;


function exportTableToExcel() {
    // 1. Check if we have data to export
    // We use filteredData if it exists, otherwise the raw inquiriesData
    const dataSource = (filteredData && filteredData.length > 0) ? filteredData : inquiriesData;

    if (!dataSource || dataSource.length === 0) {
        showModalMessage("No data available to export.");
        return;
    }

    // 2. Format the data for Excel
    // We map the data to create nice headers (Instead of "full_name", we want "Full Name")
    const exportData = dataSource.map(item => ({
        "Client ID": item.inquiry_id,
        "Full Name": item.full_name,
        "Email": item.email,
        "Phone": item.phone || '-',
        "Date": new Date(item.inquiry_date).toLocaleDateString(),
        "Status": item.status,
        "Company": item.company || '-',
        "Address": item.address || '-',
        "Type": item.concern_type,
        "Source": item.discovery_platform
    }));

    // 3. Create a new Workbook
    const wb = XLSX.utils.book_new();
    
    // 4. Create a Worksheet from our formatted data
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Optional: Adjust column widths for better readability
    const wscols = [
        {wch: 15}, // ID
        {wch: 25}, // Name
        {wch: 25}, // Email
        {wch: 15}, // Phone
        {wch: 15}, // Date
        {wch: 15}, // Status
        {wch: 20}, // Company
        {wch: 30}, // Address
        {wch: 20}, // Type
        {wch: 15}  // Source
    ];
    ws['!cols'] = wscols;

    // 5. Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Inquiries_Data");

    // 6. Generate filename with today's date
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Techstacks_Export_${dateStr}.xlsx`;

    // 7. Save the file
    XLSX.writeFile(wb, fileName);
}


function exportPDF() {
    const { jsPDF } = window.jspdf;
    // 'l' for landscape is essential to fit all these columns
    const doc = new jsPDF('l', 'mm', 'a4');

    // Use your dataSource (filtered or raw) just like your Excel function
    const dataSource = (filteredData && filteredData.length > 0) ? filteredData : inquiriesData;

    if (!dataSource || dataSource.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Map the data to match your screenshot columns
    const body = dataSource.map(item => [
        item.inquiry_id,
        item.full_name,
        item.email,
        item.phone || '-',
        new Date(item.inquiry_date).toLocaleDateString(),
        item.status,
        item.company || '-',
        item.address || '-',
        item.concern_type,
        item.discovery_platform
    ]);

    const head = [[
        "Client ID", "Full Name", "Email", "Phone", "Date", 
        "Status", "Company", "Address", "Type", "Source"
    ]];

    doc.autoTable({
        head: head,
        body: body,
        startY: 10, // Starts high since title is removed
        theme: 'grid',
        styles: {
            fontSize: 7, // Smaller font to fit 10 columns
            cellPadding: 2,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [67, 243, 208], // Your brand green
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        },
        // Adjust specific column widths to prevent crowding
        columnStyles: {
            0: { cellWidth: 20 }, // ID
            2: { cellWidth: 40 }, // Email (usually long)
            7: { cellWidth: 40 }, // Address (usually long)
        },
        margin: { top: 10, left: 10, right: 10 }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Techstacks_Inquiries_${dateStr}.pdf`);
}

// Utility to open/close the modal
function openExportModal() {
    document.getElementById('exportChoiceModal').style.display = 'flex';
}

function closeExportModal() {
    document.getElementById('exportChoiceModal').style.display = 'none';
}


// Function to Open
function openExportModal() {
    document.getElementById('exportChoiceModal').style.display = 'flex';
}

// Function to Close
function closeExportModal() {
    document.getElementById('exportChoiceModal').style.display = 'none';
}

// The "Click Background to Close" Logic
window.addEventListener('click', function(event) {
    const exportModal = document.getElementById('exportChoiceModal');
    const importModal = document.getElementById('importChoiceModal');

    // If the user clicked the actual dark background overlay
    if (event.target === exportModal) {
        closeExportModal();
    }
    if (event.target === importModal) {
        // Assuming you have a close function for import too
        importModal.style.display = 'none';
    }
});