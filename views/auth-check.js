// // auth-check.js
// (function() {
//     const user = localStorage.getItem('user');
    
//     // Log to console so you can see if it's working
//     console.log("Checking authentication...");
//     console.log("User found in storage:", user);

//     // If user is null, undefined, or the string "null"
//     if (!user || user === "null" || user === "undefined") {
//         console.log("Redirecting to login...");
//         window.location.replace('index.html'); 
//     }
// })();

(function() {
    const path = window.location.pathname;

    // 1. If we are on the login page, STOP and let them login
    if (path.endsWith('index.html') || path === '/' || path.endsWith('index')) {
        return; 
    }

    const user = localStorage.getItem('user');
    const role = localStorage.getItem('userRole') ? localStorage.getItem('userRole').toLowerCase() : null;

    // 2. If not logged in, kick to login
    if (!user || !role) {
        window.location.replace('index.html');
        return;
    }

    // 3. Define allowed pages
    const rolePermissions = {
        'superadmin': ['dashboard.html', 'register.html', 'admin-list.html', 'inquiry-new.html', 'inquiry-progress.html', 'inquiry-completed.html', 'inquiry-contacted.html', 'inquiry-cancelled.html', 'audit-history.html', 'audit-logins.html'],
        'admin': ['dashboard2.html', 'inquiry-new2.html', 'inquiry-progress2.html', 'inquiry-completed2.html', 'inquiry-contacted2.html', 'inquiry-cancelled2.html', 'audit-history2.html', 'audit-logins2.html']
    };

    const allowedPages = rolePermissions[role] || [];
    
    // Check if the current URL contains ANY of the allowed filenames
    const isAuthorized = allowedPages.some(page => path.toLowerCase().includes(page.toLowerCase()));

    if (!isAuthorized) {
        console.warn(`Access Denied for role: ${role}. Current path: ${path}`);
        
        // --- IMPORTANT: Only redirect if NOT already on the target page ---
        if (role === 'superadmin') {
            if (!path.includes('dashboard.html')) {
                window.location.replace('dashboard.html');
            }
        } else if (role === 'admin') {
            if (!path.includes('dashboard2.html')) {
                window.location.replace('dashboard2.html');
            }
        } else {
            // Unknown role? Kick to login
            localStorage.clear();
            window.location.replace('index.html');
        }
    }
})();