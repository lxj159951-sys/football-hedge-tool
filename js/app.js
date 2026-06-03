// ===== Main Application =====

const App = {
    init() {
        // Initialize all modules
        Arbitrage.init();
        Hedge.init();
        Kelly.init();
        Prediction.init();
        ValueBet.init();
        Records.init();
        Bankroll.init();
        ApiConfig.init();
        Matches.init();

        // Initialize new modules
        Auth.init();
        HedgeConfig.init();
        HedgeHistory.init();
        TwoOne.init();
        Single.init();
        Goals.init();
        HalfFull.init();
        FullCover.init();
        BkTwoOne.init();
        BkSingle.init();
        Scores.init();

        // Setup navigation
        this.setupNavigation();

        // Setup menu toggle for mobile
        this.setupMobileMenu();

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup export
        this.setupExport();

        // Update dashboard
        this.updateDashboard();

        // Check API status and update UI
        this.checkApiStatus();

        console.log('Football Hedge Tool initialized');
    },

    checkApiStatus() {
        const config = Store.getApiConfig();
        const loadBtn = document.getElementById('loadTeamData');

        if (config.connected) {
            loadBtn.disabled = false;
            loadBtn.title = '从 API 加载球队数据';
        } else {
            loadBtn.disabled = true;
            loadBtn.title = '请先配置并连接 API';
        }
    },

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links li[data-tab]');

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
    },

    switchTab(tabId) {
        // Update nav
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        // Close mobile menu
        document.querySelector('.sidebar').classList.remove('open');

        // 根据标签页刷新数据
        switch (tabId) {
            case 'dashboard':
                if (typeof Matches !== 'undefined') {
                    Matches.loadMatches();
                }
                this.updateDashboard();
                break;

            case 'prediction':
                if (typeof Prediction !== 'undefined') {
                    Prediction.checkApiStatus();
                }
                break;

            case 'records':
                if (typeof Records !== 'undefined') {
                    Records.loadRecords();
                }
                break;

            case 'bankroll':
                if (typeof Bankroll !== 'undefined') {
                    Bankroll.updateDisplay();
                    Bankroll.renderChart();
                }
                break;

            case 'arbitrage':
                // 套利计算器不需要刷新
                break;

            case 'hedge':
                // 对冲计算器不需要刷新
                break;

            case 'kelly':
                // 凯利公式不需要刷新
                break;

            case 'valuebet':
                // 价值投注不需要刷新
                break;

            case 'apiconfig':
                if (typeof ApiConfig !== 'undefined') {
                    ApiConfig.loadConfig();
                }
                break;

            case 'twoOneCalc':
            case 'singleCalc':
            case 'goalsCalc':
            case 'halfFullCalc':
            case 'fullCoverCalc':
            case 'bkTwoOne':
            case 'bkSingle':
                // 对冲计算页面不需要特殊处理
                break;

            case 'hedgeHistory':
                if (typeof HedgeHistory !== 'undefined') {
                    HedgeHistory.loadPlans();
                    HedgeHistory.renderPlans();
                }
                break;

            case 'scores':
                if (typeof Scores !== 'undefined') {
                    Scores.loadScores();
                }
                break;

            case 'hedgeSettings':
                if (typeof HedgeConfig !== 'undefined') {
                    HedgeConfig.loadConfig();
                    HedgeConfig.loadConfigToForm();
                }
                break;
        }
    },

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');

        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    },

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const settings = Store.getSettings();

        // Apply saved theme
        if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');

            themeToggle.innerHTML = isLight
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';

            Store.updateSettings({ theme: isLight ? 'light' : 'dark' });
        });
    },

    setupExport() {
        document.getElementById('exportData').addEventListener('click', () => {
            const data = Store.exportAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `football-hedge-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            Utils.showToast('数据已导出', 'success');
        });
    },

    updateDashboard() {
        const stats = Store.getStatistics();
        const bankroll = Store.getBankroll();

        // Update stat cards
        document.getElementById('totalBankroll').textContent = Utils.formatCurrency(bankroll.current);
        document.getElementById('totalPnl').textContent = Utils.formatCurrency(stats.totalPnl);
        document.getElementById('totalPnl').className = `stat-value ${stats.totalPnl >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('winRate').textContent = Utils.formatPercent(stats.winRate);
        document.getElementById('totalBets').textContent = stats.totalBets;

        // Render charts
        this.renderPnlChart();
        this.renderDistributionChart();
    },

    renderPnlChart() {
        const records = Store.getRecords();
        const settled = records
            .filter(r => r.result === 'win' || r.result === 'lose')
            .reverse();

        if (settled.length === 0) return;

        const ctx = document.getElementById('pnlChart').getContext('2d');

        // Destroy existing chart if any
        if (this._pnlChart) {
            this._pnlChart.destroy();
        }

        let cumulativePnl = 0;
        const labels = [];
        const data = [];

        settled.forEach(record => {
            cumulativePnl += record.pnl || 0;
            labels.push(Utils.formatDate(record.date));
            data.push(Math.round(cumulativePnl * 100) / 100);
        });

        this._pnlChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '累计盈亏',
                    data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;

                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(245, 87, 108, 0.1)');
                        gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.05)');
                        gradient.addColorStop(1, 'rgba(67, 233, 123, 0.1)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: data.map(v => v >= 0 ? 'rgba(67, 233, 123, 1)' : 'rgba(245, 87, 108, 1)')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '盈亏: ' + Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#a0a3b1',
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(45, 48, 68, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a0a3b1',
                            maxTicksLimit: 10
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    renderDistributionChart() {
        const records = Store.getRecords();

        if (records.length === 0) return;

        const ctx = document.getElementById('distributionChart').getContext('2d');

        // Destroy existing chart if any
        if (this._distChart) {
            this._distChart.destroy();
        }

        // Count by type
        const typeCounts = {};
        records.forEach(record => {
            const type = record.type || '其他';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);

        const colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(67, 233, 123, 0.8)',
            'rgba(240, 165, 0, 0.8)',
            'rgba(245, 87, 108, 0.8)',
            'rgba(79, 172, 254, 0.8)',
            'rgba(168, 85, 247, 0.8)'
        ];

        this._distChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0a3b1',
                            padding: 16,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
