document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🚫 stop page reload

    // ✅ Password confirmation check
    const password = document.getElementById("pw").value;
    const confirm = document.getElementById("cpw").value;

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    // ✅ Collect form data
    const data = {
      firstname: document.getElementById("fn").value,
      lastname: document.getElementById("ln").value,
      email: document.getElementById("em").value,
      phone_user: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      role: document.getElementById("rl").value,
      password
    };

    try {
      // ✅ Send to backend
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Server error: ${res.status}`);
      }

      // ✅ Show modal with success message and user name
      const modal = document.getElementById("successModal");
      const message = document.getElementById("modalMessage");
      const closeBtn = document.getElementById("closeModal");
      const okBtn = document.getElementById("okButton");

      const fullName = `${data.firstname} ${data.lastname}`;
      message.innerHTML = `<strong>${fullName}</strong> has been successfully created as <strong>${data.role}</strong>`;
      modal.style.display = "block";

      // Reset form
      document.getElementById("registerForm").reset();
      updatePreview();

      // Close modal when clicking X
      closeBtn.onclick = () => modal.style.display = "none";

      // Close modal when clicking OK
      okBtn.onclick = () => modal.style.display = "none";

      // Close modal when clicking outside
      window.onclick = (event) => {
        if (event.target === modal) modal.style.display = "none";
      };
    } catch (err) {
      alert(err.message);
    }
  });
});

 function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    }

    function toggleTheme() {
        const body = document.body;
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
    }

    function updatePreview() {
        const fn = document.getElementById('fn').value || 'John';
        const ln = document.getElementById('ln').value || 'Doe';
        const em = document.getElementById('em').value || 'admin@techstacks.com';
        const rl = document.getElementById('rl').value;
        
        document.getElementById('p-name').innerText = `${fn} ${ln}`;
        document.getElementById('p-email').innerText = em;
        document.getElementById('p-role').innerText = rl;
        document.getElementById('av').innerText = fn.charAt(0).toUpperCase();
    }

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.menu-toggle');
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    updatePreview();

   