// ===== Bankroll Management =====

const Bankroll = {
    chart: null,

    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.renderChart();
    },

    bindEvents() {
        document.getElementById('saveBankroll').addEventListener('click', () => this.saveSettings());
    },

    loadSettings() {
        const bankroll = Store.getBankroll();
        document.getElementById('initialBankroll').value = bankroll.initial || '';
        document.getElementById('stopLossAmount').value = bankroll.stopLoss || '';
        document.getElementById('profitTargetAmount').value = bankroll.profitTarget || '';
        document.getElementById('maxBetPercentage').value = bankroll.maxBetPercent || 10;
    },

    saveSettings() {
        const initial = parseFloat(document.getElementById('initialBankroll').value) || 0;
        const stopLoss = parseFloat(document.getElementById('stopLossAmount').value) || 0;
        const profitTarget = parseFloat(document.getElementById('profitTargetAmount').value) || 0;
        const maxBetPercent = parseFloat(document.getElementById('maxBetPercentage').value) || 10;

        if (initial <= 0) {
            Utils.showToast('请输入有效的初始资金', 'error');
            return;
        }

        const bankroll = Store.getBankroll();
        const isFirstSetup = bankroll.initial === 0;

        Store.updateBankroll({
            initial,
            current: isFirstSetup ? initial : bankroll.current,
            stopLoss,
            profitTarget,
            maxBetPercent,
            history: isFirstSetup ? [{
                amount: initial,
                type: 'deposit',
                balance: initial,
                note: '初始资金',
                date: new Date().toISOString()
            }] : bankroll.history
        });

        this.updateDisplay();
        this.renderChart();
        Utils.showToast('资金设置已保存', 'success');
    },

    updateDisplay() {
        const bankroll = Store.getBankroll();

        document.getElementById('currentBankroll').textContent = Utils.formatCurrency(bankroll.current);
        document.getElementById('stopLoss').textContent = Utils.formatCurrency(bankroll.stopLoss);
        document.getElementById('profitTarget').textContent = Utils.formatCurrency(bankroll.profitTarget);
        document.getElementById('maxBetPercent').textContent = bankroll.maxBetPercent + '%';

        // Check alerts
        this.checkAlerts(bankroll);
    },

    checkAlerts(bankroll) {
        if (bankroll.initial === 0) return;

        const pnl = bankroll.current - bankroll.initial;
        const pnlPercent = (pnl / bankroll.initial) * 100;

        // Stop loss alert
        if (bankroll.stopLoss > 0 && bankroll.current <= bankroll.stopLoss) {
            Utils.showToast('⚠️ 警告：已达到止损线！建议停止投注。', 'error', 5000);
        }

        // Profit target alert
        if (bankroll.profitTarget > 0 && bankroll.current >= bankroll.profitTarget) {
            Utils.showToast('🎉 恭喜：已达到盈利目标！', 'success', 5000);
        }

        // Consecutive loss warning
        const records = Store.getRecords();
        let consecutiveLosses = 0;
        for (const r of records) {
            if (r.result === 'lose') {
                consecutiveLosses++;
            } else {
                break;
            }
        }
        if (consecutiveLosses >= 3) {
            Utils.showToast(`⚠️ 警告：连续亏损 ${consecutiveLosses} 次，建议暂停冷静。`, 'warning', 5000);
        }
    },

    renderChart() {
        const bankroll = Store.getBankroll();
        const history = bankroll.history || [];

        if (history.length === 0) return;

        const ctx = document.getElementById('bankrollChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        const labels = history.map(h => Utils.formatDate(h.date));
        const data = history.map(h => h.balance);

        // Add stop loss and profit target lines
        const datasets = [{
            label: '资金走势',
            data: data,
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)'
        }];

        if (bankroll.stopLoss > 0) {
            datasets.push({
                label: '止损线',
                data: Array(labels.length).fill(bankroll.stopLoss),
                borderColor: 'rgba(245, 87, 108, 0.5)',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
        }

        if (bankroll.profitTarget > 0) {
            datasets.push({
                label: '盈利目标',
                data: Array(labels.length).fill(bankroll.profitTarget),
                borderColor: 'rgba(67, 233, 123, 0.5)',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0a3b1',
                            padding: 16,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
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
                            color: '#a0a3b1'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    // Update bankroll after bet result
    updateAfterBet(amount, type, note = '') {
        const bankroll = Store.getBankroll();
        bankroll.current += amount;
        bankroll.current = Math.round(bankroll.current * 100) / 100;

        Store.updateBankroll({ current: bankroll.current });
        Store.addBankrollHistory(amount, type, note);

        this.updateDisplay();
        this.renderChart();
    },

    // Get max bet amount
    getMaxBet() {
        const bankroll = Store.getBankroll();
        return bankroll.current * (bankroll.maxBetPercent / 100);
    }
};
