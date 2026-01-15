console.log("completed-list.js loaded");

 let sortNameAsc = true;
    let sortDateAsc = false;

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    }

    function toggleTheme() {
        const body = document.body;
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
    }

   
    function applyFilters() {
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        const typeValue = document.getElementById('typeFilter').value;
        const rows = document.getElementById('completedBody').getElementsByTagName('tr');

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
        const tbody = document.getElementById('completedBody');
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

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.menu-toggle');
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

function renderCompletedInquiries(inquiries) {
  const tbody = document.getElementById('completedBody');
  tbody.innerHTML = inquiries.map(inq => {
    const date = new Date(inq.status_date);
    const formattedDate = date.toLocaleString();
    const notes = inq.latestNote || 'No notes available';
    const statusDisplay = inq.status.includes('Successful') ? 'Successful' : 'Unsuccessful';
    const badgeClass = inq.status.includes('Successful') ? 'bg-success' : 'bg-danger';

    return `
      <tr onclick="showDetails(
        '${inq.inquiry_id}',
        '${inq.full_name}',
        '${inq.email}',
        '${inq.concern_type}',
        '${notes.replace(/'/g, "\\'") }',
        '${statusDisplay}',
        '${formattedDate}'
      )">
        <td><span style="font-family: monospace; color: var(--primary);">${inq.inquiry_id}</span></td>
        <td><b>${inq.full_name}</b></td>
        <td>${inq.concern_type}</td>
        <td>Staff</td>
        <td><span class="status-badge ${badgeClass}">${statusDisplay}</span></td>
        <td data-timestamp="${inq.status_date}">${formattedDate}</td>
      </tr>
    `;
  }).join('');
}

async function loadCompletedInquiries() {
  try {
    const successRes = await fetch('/api/inquiries?status=Completed-Successful');
    const unsuccessRes = await fetch('/api/inquiries?status=Completed-Unsuccessful');
    const successInquiries = await successRes.json();
    const unsuccessInquiries = await unsuccessRes.json();
    const allInquiries = [...successInquiries, ...unsuccessInquiries].sort((a, b) => new Date(b.status_date) - new Date(a.status_date));
    renderCompletedInquiries(allInquiries);
  } catch (err) {
    console.error('Error loading completed inquiries:', err);
  }
}

function showDetails(ref, name, email, type, notes, outcome, date) {
  document.getElementById('det-ref').innerText = ref;
  document.getElementById('det-name').innerText = name;
  document.getElementById('det-type').innerText = type;
  document.getElementById('det-outcome').innerText = outcome;
  document.getElementById('det-message').innerText = notes;
  document.getElementById('det-date').innerText = date;
  document.getElementById('det-message').style.color = 'var(--text)';
}

document.addEventListener('DOMContentLoaded', () => {
  loadCompletedInquiries();
});
