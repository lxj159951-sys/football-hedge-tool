// ===== Utility Functions =====

const Utils = {
    // Format currency
    formatCurrency(amount) {
        return '¥' + Number(amount).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    // Format percentage
    formatPercent(value, decimals = 1) {
        return Number(value).toFixed(decimals) + '%';
    },

    // Format odds
    formatOdds(value) {
        return Number(value).toFixed(2);
    },

    // Calculate implied probability from odds
    impliedProbability(odds) {
        return (1 / odds) * 100;
    },

    // Check if arbitrage exists
    checkArbitrage(oddsArray) {
        const totalImplied = oddsArray.reduce((sum, odds) => sum + (1 / odds), 0);
        return {
            isArbitrage: totalImplied < 1,
            totalImplied: totalImplied * 100,
            margin: (1 - totalImplied) * 100
        };
    },

    // Calculate arbitrage stakes
    calculateArbitrageStakes(oddsArray, totalStake) {
        const totalImplied = oddsArray.reduce((sum, odds) => sum + (1 / odds), 0);
        return oddsArray.map(odds => {
            const stake = (totalStake / odds) / totalImplied;
            return Math.round(stake * 100) / 100;
        });
    },

    // Poisson probability
    poissonProbability(lambda, k) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    },

    // Factorial
    factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    },

    // Kelly criterion
    kellyCriterion(winProb, odds, fraction = 1) {
        const b = odds - 1;
        const p = winProb / 100;
        const q = 1 - p;
        const kelly = ((b * p - q) / b) * fraction;
        return Math.max(0, kelly);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format date
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('zh-CN');
    },

    // Format datetime
    formatDateTime(date) {
        const d = new Date(date);
        return d.toLocaleString('zh-CN');
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Export to CSV
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('没有数据可导出', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        this.showToast('导出成功', 'success');
    },

    // Validate number
    isValidNumber(value, min = 0, max = Infinity) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Escape HTML to prevent XSS
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
