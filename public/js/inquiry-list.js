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

    function showDetails(ref, name, email, source, type, msg, date) {
        document.getElementById('det-ref').innerText = ref;
        document.getElementById('det-name').innerText = name;
        document.getElementById('det-email').innerText = email;
        document.getElementById('det-source').innerText = source;
        document.getElementById('det-type').innerText = type;
        document.getElementById('det-message').innerText = msg;
        document.getElementById('det-date').innerText = date;
        document.getElementById('det-message').style.color = 'var(--text)';
        selectedInquiryId = ref;
        document.getElementById('updateStatusBtn').disabled = false;
    }

    function openStatusModal() {
        if (!window.selectedInquiryId && !selectedInquiryId) {
            showModalMessage('Please select an inquiry first');
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

function renderInquiries(inquiries) {
  const tbody = document.getElementById("inquiryBody");
  tbody.innerHTML = inquiries.map(inq => {
    const date = new Date(inq.inquiry_date);
    const formattedDate = date.toLocaleString();

    return `
      <tr onclick="showDetails(
        '${inq.inquiry_id}',
        '${inq.full_name}',
        '${inq.email}',
        '${inq.discovery_platform}',
        '${inq.concern_type}',
        '${inq.message.replace(/'/g, "\\'")}',
        '${formattedDate}'
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

function showDetails(ref, name, email, source, type, message, date) {
  document.getElementById("det-ref").textContent = ref;
  document.getElementById("det-name").textContent = name;
  document.getElementById("det-email").textContent = email;
  document.getElementById("det-source").textContent = source;
  document.getElementById("det-type").textContent = type;
  document.getElementById("det-date").textContent = date;
  document.getElementById("det-message").textContent = message;
  window.selectedInquiryId = ref;
  const btn = document.getElementById('updateStatusBtn');
  if (btn) btn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  loadInquiries();
  document.getElementById("typeFilter").addEventListener("change", applyFilters);
  document.getElementById("sourceFilter").addEventListener("change", applyFilters);
  document.getElementById("searchInput").addEventListener("keyup", applyFilters);
});