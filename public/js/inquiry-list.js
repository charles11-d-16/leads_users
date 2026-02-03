console.log("inquiry-list.js loaded");

let sortNameAsc = true;
    let sortDateAsc = false;
    let selectedInquiryId = null;

    function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
    
    function toggleTheme() {
        const body = document.body;
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
    }

    function applyFilters() {
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        const typeValue = document.getElementById('typeFilter').value;
        const sourceValue = document.getElementById('sourceFilter').value;
        const rows = document.getElementById('inquiryBody').getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const refId = rows[i].getElementsByTagName('td')[0].innerText.toLowerCase();
            const name = rows[i].getElementsByTagName('td')[1].innerText.toLowerCase();
            const type = rows[i].getElementsByTagName('td')[2].innerText;
            const source = rows[i].querySelector('.status-badge').innerText;
            
            const matchesSearch = name.includes(searchValue) || type.toLowerCase().includes(searchValue) || refId.includes(searchValue);
            const matchesType = typeValue === 'All' || type === typeValue;
            const matchesSource = sourceValue === 'All' || source === sourceValue;

            rows[i].style.display = (matchesSearch && matchesType && matchesSource) ? "" : "none";
        }
    }

    function sortInquiries(criteria) {
        const tbody = document.getElementById('inquiryBody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        if (criteria === 'name') {
            rows.sort((a, b) => {
                const valA = a.cells[1].innerText.toLowerCase();
                const valB = b.cells[1].innerText.toLowerCase();
                return sortNameAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
            const sortIcon = document.getElementById('sortIcon');
            sortIcon.className = sortNameAsc ? 'bi bi-sort-alpha-up' : 'bi bi-sort-alpha-down';
            sortNameAsc = !sortNameAsc;
        } else if (criteria === 'date') {
            rows.sort((a, b) => {
                const dateA = new Date(a.cells[4].getAttribute('data-timestamp'));
                const dateB = new Date(b.cells[4].getAttribute('data-timestamp'));
                return sortDateAsc ? dateA - dateB : dateB - dateA;
            });
            const dateIcon = document.getElementById('dateSortIcon');
            dateIcon.className = sortDateAsc ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
            sortDateAsc = !sortDateAsc;
        }
        
        rows.forEach(row => tbody.appendChild(row));
    }

    // Global storage
window.currentInquiryData = {};
window.selectedInquiryId = null;

function showDetails(ref, name, email, source, type, message, date, phone, company, address) {
    console.log("Row clicked:", ref); // Debugging check

    // 1. Update Text in Sidebar
    document.getElementById("det-ref").textContent = ref;
    document.getElementById("det-name").textContent = name;
    document.getElementById("det-email").textContent = email;
    document.getElementById("det-phone").textContent = phone || '-';
    document.getElementById("det-company").textContent = company || '-';
    document.getElementById("det-address").textContent = address || '-';
    document.getElementById("det-source").textContent = source;
    document.getElementById("det-type").textContent = type;
    document.getElementById("det-date").textContent = date;
    document.getElementById("det-message").textContent = message;

    // 2. Enable the Buttons
    window.selectedInquiryId = ref;
    
    const statusBtn = document.getElementById('updateStatusBtn');
    const detailsBtn = document.getElementById('updateDetailsBtn');

    if (statusBtn) {
        statusBtn.disabled = false;
        statusBtn.style.opacity = "1"; // Visual feedback
        statusBtn.style.cursor = "pointer";
    }
    
    if (detailsBtn) {
        detailsBtn.disabled = false;
        detailsBtn.style.opacity = "1"; // Visual feedback
        detailsBtn.style.cursor = "pointer";
    }

    // 3. Store data for the modal form
    window.currentInquiryData = {
        ref, name, email, source, type, message, date, phone, company, address
    };
}
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

    document.getElementById('statusForm').onsubmit = async function(e) {
        e.preventDefault();
        const inquiryId = window.selectedInquiryId || selectedInquiryId;
        const status = document.getElementById('statusSelect').value;
        const notes = document.getElementById('notesInput').value;
        
        if (!inquiryId) {
            showModalMessage('No inquiry selected');
            return;
        }
        
        try {
            const response = await fetch(`/api/inquiries/${inquiryId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes })
            });
            
            if (!response.ok) throw new Error('Failed to update status');
            
            showModalMessage('Status updated successfully!', true);
            document.getElementById('statusModal').style.display = 'none';
            document.getElementById('statusForm').reset();
        } catch (error) {
            showModalMessage('Error: ' + error.message);
        }
    };

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.menu-toggle');
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

function renderInquiries(inquiries) {
  const tbody = document.getElementById("inquiryBody");
  
  tbody.innerHTML = inquiries.map(inq => {
    const date = new Date(inq.inquiry_date);
    const formattedDate = date.toLocaleString();

    // --- FIX: helper to safely clean text for HTML attributes ---
    const clean = (str) => {
        if (!str) return '';
        return str
            .replace(/'/g, "\\'")        // Escape single quotes
            .replace(/"/g, '&quot;')     // Escape double quotes
            .replace(/\n/g, ' ')         // Replace newlines with spaces (PREVENTS CRASH)
            .replace(/\r/g, '');         // Remove carriage returns
    };

    return `
      <tr style="cursor: pointer;" onclick="showDetails(
        '${inq.inquiry_id}',
        '${clean(inq.full_name)}',
        '${clean(inq.email)}',
        '${clean(inq.discovery_platform)}',
        '${clean(inq.concern_type)}',
        '${clean(inq.message)}',
        '${formattedDate}',
        '${clean(inq.phone)}',     
        '${clean(inq.company)}',   
        '${clean(inq.address)}'    
      )">
        <td><span style="font-family: monospace; color: var(--primary);">${inq.inquiry_id}</span></td>
        <td><b>${inq.full_name}</b></td>
        <td>${inq.concern_type}</td>
        <td><span class="status-badge bg-new">${inq.discovery_platform}</span></td>
        <td data-timestamp="${inq.inquiry_date}">${formattedDate}</td>
      </tr>
    `;
  }).join('');
}

async function loadInquiries() {
  try {
    const res = await fetch("/api/inquiries?status=New");
    const inquiries = await res.json();
    renderInquiries(inquiries);
  } catch (err) {
    console.error("Load inquiries error:", err);
  }
}

async function applyFilters() {
  const search = document.getElementById("searchInput").value.trim();
  const type = document.getElementById("typeFilter").value;
  const source = document.getElementById("sourceFilter").value;

  const params = new URLSearchParams({ search, type, source, status: 'New' });
  console.log("Fetching inquiries with:", params.toString());

  const res = await fetch(`/api/inquiries?${params.toString()}`);
  const inquiries = await res.json();
  renderInquiries(inquiries);
}



document.addEventListener("DOMContentLoaded", () => {
  loadInquiries();
  document.getElementById("typeFilter").addEventListener("change", applyFilters);
  document.getElementById("sourceFilter").addEventListener("change", applyFilters);
  document.getElementById("searchInput").addEventListener("keyup", applyFilters);
});


// new modal deatils stataus update functions

// --- NEW: Open Status Modal ---
function openStatusModal() {
    if (!window.selectedInquiryId) {
        showModalMessage('Please select an inquiry first');
        return;
    }
    document.getElementById('statusModal').style.display = 'block';
}

// Close Status Modal - when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupStatusModalClose);
} else {
    setupStatusModalClose();
}

function setupStatusModalClose() {
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('statusModal').style.display = 'none';
        };
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const statusModal = document.getElementById('statusModal');
        const detailsModal = document.getElementById('detailsModal');
        if (event.target == statusModal) {
            statusModal.style.display = 'none';
        }
        if (event.target == detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
}

// --- NEW: Update Details Logic ---

function openDetailsModal() {
    if (!window.selectedInquiryId) {
        showModalMessage('Please select an inquiry first');
        return;
    }

    // Populate the form fields with the stored data
    const data = window.currentInquiryData;
    console.log('Populating form with data:', data);
    document.getElementById('editName').value = data.name || '';
    document.getElementById('editEmail').value = data.email || '';
    document.getElementById('editPhone').value = data.phone || '';
    document.getElementById('editCompany').value = data.company || '';
    document.getElementById('editAddress').value = data.address || '';
    document.getElementById('editMessage').value = data.message || '';

    // Show Modal
    document.getElementById('detailsModal').style.display = 'block';
    
    // Auto scroll to top of modal
    const modal = document.getElementById('detailsModal');
    modal.scrollTop = 0;
}

// Close Modal Logic
document.getElementById('closeDetailsModal').onclick = function() {
    document.getElementById('detailsModal').style.display = 'none';
};

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('detailsModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Handle Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const detailsForm = document.getElementById('detailsForm');
    if (detailsForm) {
        detailsForm.onsubmit = async function(e) {
            e.preventDefault();
            const inquiryId = window.selectedInquiryId;
            
            if (!inquiryId) {
                showModalMessage('Error: No inquiry selected');
                return;
            }
            
            // Gather data from form
            const fullName = document.getElementById('editName').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const message = document.getElementById('editMessage').value.trim();
            
            // Validate required fields
            if (!fullName) {
                showModalMessage('Error: Full Name is required');
                return;
            }
            if (!email) {
                showModalMessage('Error: Email is required');
                return;
            }
            if (!message) {
                showModalMessage('Error: Message is required');
                return;
            }
            
            const formData = {
                full_name: fullName,
                email: email,
                phone: document.getElementById('editPhone').value.trim(),
                company: document.getElementById('editCompany').value.trim(),
                address: document.getElementById('editAddress').value.trim(),
                message: message
            };

            try {
                const response = await fetch(`/api/inquiries/${inquiryId}`, {
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update details');
                }

                const result = await response.json();
                showModalMessage('Details updated successfully!', true);
                document.getElementById('detailsModal').style.display = 'none';
                
            } catch (error) {
                console.error(error);
                showModalMessage('Error: ' + error.message);
            }
        };
    }
});