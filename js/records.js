// ===== Betting Records =====

const Records = {
    currentFilter: 'all',

    init() {
        this.bindEvents();
        this.setDefaultDate();
        this.loadRecords();
    },

    bindEvents() {
        // Add record modal
        document.getElementById('addRecordBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeRecordModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelRecord').addEventListener('click', () => this.closeModal());
        document.getElementById('saveRecord').addEventListener('click', () => this.saveRecord());

        // Filter
        document.getElementById('recordFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadRecords();
        });

        // Export
        document.getElementById('exportRecords').addEventListener('click', () => this.exportRecords());

        // Click outside modal to close
        document.getElementById('recordModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    },

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('recordDate').value = today;
    },

    openModal(record = null) {
        const modal = document.getElementById('recordModal');
        modal.classList.add('active');

        if (record) {
            // Edit mode
            document.getElementById('recordMatch').value = record.match || '';
            document.getElementById('recordType').value = record.type || '胜平负';
            document.getElementById('recordSelection').value = record.selection || '';
            document.getElementById('recordOdds').value = record.odds || '';
            document.getElementById('recordStake').value = record.stake || '';
            document.getElementById('recordResult').value = record.result || 'pending';
            document.getElementById('recordDate').value = record.date || '';
            document.getElementById('recordNote').value = record.note || '';
            modal.dataset.editId = record.id;
        } else {
            // Add mode
            this.clearForm();
            this.setDefaultDate();
            delete modal.dataset.editId;
        }
    },

    closeModal() {
        document.getElementById('recordModal').classList.remove('active');
        this.clearForm();
    },

    clearForm() {
        document.getElementById('recordMatch').value = '';
        document.getElementById('recordType').value = '胜平负';
        document.getElementById('recordSelection').value = '';
        document.getElementById('recordOdds').value = '';
        document.getElementById('recordStake').value = '';
        document.getElementById('recordResult').value = 'pending';
        document.getElementById('recordDate').value = '';
        document.getElementById('recordNote').value = '';
    },

    saveRecord() {
        const match = document.getElementById('recordMatch').value.trim();
        const type = document.getElementById('recordType').value;
        const selection = document.getElementById('recordSelection').value.trim();
        const odds = parseFloat(document.getElementById('recordOdds').value);
        const stake = parseFloat(document.getElementById('recordStake').value);
        const result = document.getElementById('recordResult').value;
        const date = document.getElementById('recordDate').value;
        const note = document.getElementById('recordNote').value.trim();

        // Validation
        if (!match) {
            Utils.showToast('请输入比赛信息', 'error');
            return;
        }

        if (!odds || odds <= 1) {
            Utils.showToast('请输入有效的赔率', 'error');
            return;
        }

        if (!stake || stake <= 0) {
            Utils.showToast('请输入有效的投注金额', 'error');
            return;
        }

        // Calculate PnL
        let pnl = 0;
        if (result === 'win') {
            pnl = stake * (odds - 1);
        } else if (result === 'lose') {
            pnl = -stake;
        }

        const record = {
            match,
            type,
            selection,
            odds,
            stake,
            result,
            pnl: Math.round(pnl * 100) / 100,
            date: date || new Date().toISOString().split('T')[0],
            note
        };

        const modal = document.getElementById('recordModal');
        if (modal.dataset.editId) {
            // Update existing
            Store.updateRecord(modal.dataset.editId, record);
            Utils.showToast('记录已更新', 'success');
        } else {
            // Add new
            Store.addRecord(record);
            Utils.showToast('记录已添加', 'success');
        }

        this.closeModal();
        this.loadRecords();
        this.updateDashboard();
    },

    loadRecords() {
        const records = Store.getRecords();
        const filtered = this.filterRecords(records);
        this.renderRecords(filtered);
        this.updateStats(records);
    },

    filterRecords(records) {
        switch (this.currentFilter) {
            case 'win':
                return records.filter(r => r.result === 'win');
            case 'lose':
                return records.filter(r => r.result === 'lose');
            case 'pending':
                return records.filter(r => r.result === 'pending');
            default:
                return records;
        }
    },

    renderRecords(records) {
        const tbody = document.getElementById('recordsTableBody');

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="9">暂无投注记录</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${Utils.formatDate(record.date)}</td>
                <td>${record.match}</td>
                <td>${record.type}</td>
                <td>${record.selection || '-'}</td>
                <td>${Utils.formatOdds(record.odds)}</td>
                <td>${Utils.formatCurrency(record.stake)}</td>
                <td>
                    <span class="${this.getResultClass(record.result)}">
                        ${this.getResultLabel(record.result)}
                    </span>
                </td>
                <td class="${record.pnl >= 0 ? 'win' : 'lose'}">
                    ${record.result === 'pending' ? '-' : Utils.formatCurrency(record.pnl)}
                </td>
                <td>
                    <button class="btn-icon" onclick="Records.editRecord('${record.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="Records.deleteRecord('${record.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    getResultClass(result) {
        const classes = {
            'win': 'win',
            'lose': 'lose',
            'pending': 'pending',
            'void': 'pending'
        };
        return classes[result] || '';
    },

    getResultLabel(result) {
        const labels = {
            'win': '赢',
            'lose': '输',
            'pending': '待结算',
            'void': '取消'
        };
        return labels[result] || result;
    },

    updateStats(records) {
        const stats = Store.getStatistics();

        document.getElementById('recordsTotalBets').textContent = stats.totalBets;
        document.getElementById('recordsTotalPnl').textContent = Utils.formatCurrency(stats.totalPnl);
        document.getElementById('recordsTotalPnl').className = `value ${stats.totalPnl >= 0 ? 'win' : 'lose'}`;
        document.getElementById('recordsWinRate').textContent = Utils.formatPercent(stats.winRate);
        document.getElementById('recordsROI').textContent = Utils.formatPercent(stats.roi);
        document.getElementById('recordsROI').className = `value ${stats.roi >= 0 ? 'win' : 'lose'}`;
    },

    editRecord(id) {
        const records = Store.getRecords();
        const record = records.find(r => r.id === id);
        if (record) {
            this.openModal(record);
        }
    },

    deleteRecord(id) {
        if (confirm('确定要删除这条记录吗？')) {
            Store.deleteRecord(id);
            Utils.showToast('记录已删除', 'success');
            this.loadRecords();
            this.updateDashboard();
        }
    },

    exportRecords() {
        const records = Store.getRecords();
        if (records.length === 0) {
            Utils.showToast('没有记录可导出', 'warning');
            return;
        }

        const data = records.map(r => ({
            '日期': r.date,
            '比赛': r.match,
            '类型': r.type,
            '选项': r.selection || '',
            '赔率': r.odds,
            '投注金额': r.stake,
            '结果': this.getResultLabel(r.result),
            '盈亏': r.pnl,
            '备注': r.note || ''
        }));

        Utils.exportToCSV(data, `投注记录_${new Date().toISOString().split('T')[0]}.csv`);
    },

    updateDashboard() {
        // Update dashboard stats
        if (typeof App !== 'undefined' && App.updateDashboard) {
            App.updateDashboard();
        }
    }
};
