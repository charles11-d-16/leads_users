 let charts = {};

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
                ['#43f3d0', '#1fbfa1', '#147a67', '#0a3d33'] : 
                ['#0d9488', '#14b8a6', '#5ba39d', '#8fbab5']
        };
    }

    function initCharts() {
        const colors = getThemeColors();
        const lineCtx = document.getElementById('lineChart').getContext('2d');
        const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
        const pieCtx = document.getElementById('pieChart').getContext('2d');

        charts.line = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['w1', 'w2', 'w3', 'w4'],
                datasets: [{
                    data: [5, 10, 7, 14],
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '15',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: colors.primary,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: colors.grid }, ticks: { color: colors.muted, font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: colors.muted, font: { size: 10 } } }
                }
            }
        });

        charts.doughnut = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Success', 'Unsuccessful'],
                datasets: [{
                    data: [71.4, 28.6],
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

        charts.pie = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['New', 'Contacted', 'In Progress', 'Completed'],
                datasets: [{
                    data: [10, 5, 5, 20],
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

    function toggleTheme() {
        const body = document.body;
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        document.querySelector('#themeBtn i').className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-brightness-high';
        
        Object.values(charts).forEach(chart => chart.destroy());
        initCharts();
        
        const colors = getThemeColors();
        document.getElementById('chartValue').style.color = colors.primary;
    }

    window.onload = initCharts;