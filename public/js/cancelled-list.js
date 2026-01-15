console.log("cancelled-list.js loaded");

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
        const rows = document.getElementById('leadsBody').getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const refId = rows[i].cells[0].innerText.toLowerCase();
            const name = rows[i].cells[1].innerText.toLowerCase();
            const type = rows[i].cells[2].innerText;
            const staff = rows[i].cells[3].innerText.toLowerCase();
            
            const matchesSearch = name.includes(searchValue) || type.toLowerCase().includes(searchValue) || refId.includes(searchValue) || staff.includes(searchValue);
            const matchesType = typeValue === 'All' || type === typeValue;

            rows[i].style.display = (matchesSearch && matchesType) ? "" : "none";
        }
    }

    function sortLeads(criteria) {
        const tbody = document.getElementById('leadsBody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        if (criteria === 'name') {
            rows.sort((a, b) => {
                const valA = a.cells[1].innerText.toLowerCase();
                const valB = b.cells[1].innerText.toLowerCase();
                return sortNameAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
            document.getElementById('sortIcon').className = sortNameAsc ? 'bi bi-sort-alpha-up' : 'bi bi-sort-alpha-down';
            sortNameAsc = !sortNameAsc;
        } else if (criteria === 'date') {
            rows.sort((a, b) => {
                const dateA = new Date(a.cells[5].getAttribute('data-timestamp'));
                const dateB = new Date(b.cells[5].getAttribute('data-timestamp'));
                return sortDateAsc ? dateA - dateB : dateB - dateA;
            });
            document.getElementById('dateSortIcon').className = sortDateAsc ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
            sortDateAsc = !sortDateAsc;
        }
        rows.forEach(row => tbody.appendChild(row));
    }

    function showDetails(ref, name, email, source, type, notes, staff, date) {
        document.getElementById('det-ref').innerText = ref;
        document.getElementById('det-name').innerText = name;
        document.getElementById('det-staff').innerText = staff;
        document.getElementById('det-type').innerText = type;
        document.getElementById('det-message').innerText = notes;
        document.getElementById('det-date').innerText = date;
        document.getElementById('det-message').style.color = 'var(--text)';
        window.selectedInquiryId = ref;
        document.getElementById('updateStatusBtn').disabled = false;
    }

    function openStatusModal() {
        if (!window.selectedInquiryId) {
            showModalMessage('Please select a lead first');
            return;
        }
        document.getElementById('statusModal').style.display = 'block';
    }

    document.getElementById('closeModal').onclick = function() {
        document.getElementById('statusModal').style.display = 'none';
    };

    window.onclick = function(event) {
        const modal = document.getElementById('statusModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

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

function renderCancelledInquiries(inquiries) {
  const tbody = document.getElementById('leadsBody');
  tbody.innerHTML = inquiries.map(inq => {
    const date = new Date(inq.status_date);
    const formattedDate = date.toLocaleString();
    const notes = inq.latestNote || 'No notes available';

    return `
      <tr onclick="showDetails(
        '${inq.inquiry_id}',
        '${inq.full_name}',
        '${inq.email}',
        '${inq.discovery_platform}',
        '${inq.concern_type}',
        '${notes.replace(/'/g, "\\'") }',
        'Staff Member',
        '${formattedDate}'
      )">
        <td><span style="font-family: monospace; color: var(--primary);">${inq.inquiry_id}</span></td>
        <td><b>${inq.full_name}</b></td>
        <td>${inq.concern_type}</td>
        <td><span class="status-badge bg-cancelled">${inq.status}</span></td>
        <td data-timestamp="${inq.status_date}">${formattedDate}</td>
      </tr>
    `;
  }).join('');
}

async function loadCancelledInquiries() {
  try {
    const res = await fetch('/api/inquiries?status=Cancelled');
    const inquiries = await res.json();
    renderCancelledInquiries(inquiries);
  } catch (err) {
    console.error('Error loading cancelled inquiries:', err);
  }
}

function showDetails(ref, name, email, source, type, notes, staff, date) {
  document.getElementById('det-ref').innerText = ref;
  document.getElementById('det-name').innerText = name;
  document.getElementById('det-staff').innerText = staff;
  document.getElementById('det-type').innerText = type;
  document.getElementById('det-message').innerText = notes;
  document.getElementById('det-date').innerText = date;
  document.getElementById('det-message').style.color = 'var(--text)';
  window.selectedInquiryId = ref;
  const btn = document.getElementById('updateStatusBtn');
  if (btn) btn.disabled = false;
}

function applyFilters() {
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const typeValue = document.getElementById('typeFilter').value;
  const rows = document.getElementById('leadsBody').getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const refId = rows[i].cells[0].innerText.toLowerCase();
    const name = rows[i].cells[1].innerText.toLowerCase();
    const type = rows[i].cells[2].innerText;
    const staff = rows[i].cells[3].innerText.toLowerCase();
    
    const matchesSearch = name.includes(searchValue) || type.toLowerCase().includes(searchValue) || refId.includes(searchValue) || staff.includes(searchValue);
    const matchesType = typeValue === 'All' || type === typeValue;

    rows[i].style.display = (matchesSearch && matchesType) ? "" : "none";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCancelledInquiries();
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('keyup', applyFilters);
});
