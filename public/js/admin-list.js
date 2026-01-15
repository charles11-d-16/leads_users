// public/js/admin-list.js

console.log("admin-list.js loaded");

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.querySelector('.menu-toggle');
  if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

function toggleTheme() {
  const body = document.body;
  const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
}

// ✅ Client-side filtering only
function filterAdmins() {
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const roleValue = document.getElementById('roleFilter').value;
  const statusValue = document.getElementById('statusFilter').value;
  const rows = document.getElementById('adminBody').getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const name = rows[i].cells[0].innerText.toLowerCase();
    const email = rows[i].cells[1].innerText.toLowerCase();
    const phone = rows[i].cells[2].innerText.toLowerCase();
    const role = rows[i].cells[3].innerText.trim();
    const status = rows[i].cells[4].innerText.trim();

    const matchesSearch =
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      phone.includes(searchValue);

    const matchesRole = roleValue === 'All Roles' || role === roleValue;
    const matchesStatus = statusValue === 'All Status' || status.includes(statusValue);

    rows[i].style.display = (matchesSearch && matchesRole && matchesStatus) ? "" : "none";
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();

    const tbody = document.getElementById('adminBody');
    tbody.innerHTML = users.map(user => {
      const fullName = `${user.firstname} ${user.lastname}`;
      const statusColor = user.status === 'Active' ? 'var(--primary)' : '#ff5e5e';
      const roleBadge = user.role === 'Superadmin' ? 'Superadmin' : user.role;

      return `
        <tr>
          <td style="font-weight: 600;">${fullName}</td>
          <td style="color: var(--muted);">${user.email}</td>
          <td style="color: var(--muted);">${user.phone_user || ''}</td>
          <td><span class="badge">${roleBadge}</span></td>
          <td>
            <span style="color: ${statusColor};">
              <i class="bi bi-circle-fill" style="font-size: 8px;"></i> ${user.status || 'Inactive'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 10px;">
              <i class="bi bi-pencil-square edit-btn" data-id="${user._id}" style="cursor:pointer; color: var(--primary);"></i>
              <i class="bi bi-trash3 delete-btn" data-id="${user._id}" style="cursor:pointer; color: #ff5e5e;"></i>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindRowActions();
  } catch (err) {
    console.error('Load users error:', err);
  }
}

function bindRowActions() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

async function openEditModal(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`);
    const user = await res.json();

    const form = document.getElementById('editForm');
    form.userId.value = user._id;
    form.status.value = user.status || 'Active';
    form.role.value = user.role || 'Admin';
    form.newPassword.value = '';

    document.getElementById('editModal').style.display = 'block';
  } catch (err) {
    console.error('Open modal error:', err);
  }
}

document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('editModal').style.display = 'none';
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    status: form.status.value,
    role: form.role.value,
    newPassword: form.newPassword.value
  };

  try {
    const res = await fetch(`/api/users/${form.userId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Update failed');

    document.getElementById('editModal').style.display = 'none';
    await loadUsers(); // refresh table
  } catch (err) {
    console.error('Update user error:', err);
  }
});

document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
  const userId = document.getElementById('editForm').userId.value;
  try {
    const res = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Reset failed');
    alert('Password reset triggered');
  } catch (err) {
    console.error('Reset password error:', err);
  }
});

async function deleteUser(userId) {
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  
  deleteModal.style.display = 'block';

  try {
    const res = await fetch(`/api/users/${userId}`);
    const user = await res.json();
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete ${user.firstname} ${user.lastname}?`;
  } catch (err) {
    console.error('Fetch user error:', err);
  }

  const confirmHandler = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      deleteModal.style.display = 'none';
      await loadUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  };

  const cancelHandler = () => {
    deleteModal.style.display = 'none';
  };

  confirmDeleteBtn.onclick = confirmHandler;
  cancelDeleteBtn.onclick = cancelHandler;
  closeDeleteModal.onclick = cancelHandler;

  window.onclick = (event) => {
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
    }
  };
}

// ✅ Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadUsers(); // initial load
  document.getElementById("roleFilter").addEventListener("change", filterAdmins);
  document.getElementById("statusFilter").addEventListener("change", filterAdmins);
  document.getElementById("searchInput").addEventListener("keyup", filterAdmins);
});