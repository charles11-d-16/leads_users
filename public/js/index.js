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

    // Validate form
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const captchaAnswer = parseInt(document.getElementById('captchaAnswer').value);

    // Clear previous errors
    document.getElementById('emailError').classList.remove('show');
    document.getElementById('passwordError').classList.remove('show');
    document.getElementById('roleError').classList.remove('show');
    document.getElementById('captchaError').classList.remove('show');

    let hasError = false;

    if (!email) {
        showError('emailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email');
        hasError = true;
    }

    if (!password) {
        showError('passwordError', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters');
        hasError = true;
    }

    if (!role) {
        showError('roleError', 'Please select a role');
        hasError = true;
    }

    if (isNaN(captchaAnswer) || captchaAnswer !== currentCaptcha.result) {
        showError('captchaError', 'Incorrect answer. Please try again');
        hasError = true;
    }

    if (hasError) return;

    // --- NEW: LOCATION LOGIC START ---
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Getting Location...';

    let locationData = "Not Supported";

    if (navigator.geolocation) {
        locationData = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Formats as "Latitude, Longitude"
                    resolve(`${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    resolve("Permission Denied");
                },
                { timeout: 5000 } // Wait max 5 seconds for GPS
            );
        });
    }
    // --- NEW: LOCATION LOGIC END ---

    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Include location in the data sent to the server
            body: JSON.stringify({ email, password, role, location: locationData })
        });

        const data = await response.json();

        if (!response.ok) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            showToast(data.error || 'Login failed', 'error');
            return;
        }

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);

        showToast('Login successful! Redirecting...', 'success');

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            const redirectUrl = role.toLowerCase() === 'superadmin' ? 'dashboard.html' : 'dashboard2.html';
            window.location.href = redirectUrl;
        }, 1500);
    } catch (error) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        showToast('Login failed. Please try again.', 'error');
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