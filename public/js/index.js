 // Captcha generation
        let currentCaptcha = {};

        function generateCaptcha() {
            // Addition only - ensure result doesn't exceed 99
            let num1, num2;
            do {
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
            } while (num1 + num2 > 99);
            
            const operator = '+';
            const result = num1 + num2;

            currentCaptcha = { num1, num2, operator, result };

            document.getElementById('captchaNum1').value = num1;
            document.getElementById('operator').textContent = operator;
            document.getElementById('captchaNum2').value = num2;
            document.getElementById('captchaAnswer').value = '';
            document.getElementById('captchaAnswer').max = 99;
            document.getElementById('captchaError').classList.remove('show');
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        function updateThemeIcon(theme) {
            themeToggle.innerHTML = theme === 'dark' 
                ? '<i class="bi bi-sun-fill"></i>' 
                : '<i class="bi bi-moon-fill"></i>';
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });

        // Refresh captcha
        document.getElementById('refreshCaptcha').addEventListener('click', (e) => {
            e.preventDefault();
            generateCaptcha();
        });

      // Form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- 1. Basic Form Validation ---
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const captchaAnswer = parseInt(document.getElementById('captchaAnswer').value);

    // [Insert your existing captcha/null checks here]
    if (isNaN(captchaAnswer) || captchaAnswer !== currentCaptcha.result) {
        showError('captchaError', 'Incorrect answer');
        return;
    }

    const loginBtn = document.querySelector('.login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking Location...';

    // --- 2. Request Location ---
    let locationData = null;
    let locationError = null;

    try {
        if (!navigator.geolocation) {
            throw new Error("Not Supported");
        }

        locationData = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(`${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`),
                (err) => reject("Permission Denied"),
                { timeout: 8000 } // Wait max 8 seconds
            );
        });
    } catch (err) {
        locationError = err.message || err;
    }

    // --- 3. The Gatekeeper ---
    if (locationError || !locationData) {
        // Send a request to server just to LOG the failure
        await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role, location: locationError || "Blocked", forceFail: true })
        });

        showToast("Access Denied: You must ALLOW location to log in.", "error");
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return; // STOP HERE
    }

    // --- 4. Actual Login Attempt ---
    loginBtn.textContent = 'Verifying Credentials...';
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, location: locationData })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Login failed', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            return;
        }

        showToast('Login successful!', 'success');
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
            window.location.href = role.toLowerCase() === 'superadmin' ? 'dashboard.html' : 'dashboard2.html';
        }, 1500);

    } catch (error) {
        console.error("Fetch error:", error);
        showToast("Server error. Try again later.", "error");
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function showError(elementId, message) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.classList.add('show');
        }

        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast show ${type}`;

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }

        // Initialize
        generateCaptcha();