// ===== Data Store (localStorage) =====

const Store = {
    // Storage keys
    KEYS: {
        RECORDS: 'fht_records',
        BANKROLL: 'fht_bankroll',
        API_CONFIG: 'fht_api_config',
        SETTINGS: 'fht_settings'
    },

    // Get data from localStorage
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    // Set data to localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },

    // ===== Records =====
    getRecords() {
        return this.get(this.KEYS.RECORDS) || [];
    },

    addRecord(record) {
        const records = this.getRecords();
        record.id = Utils.generateId();
        record.createdAt = new Date().toISOString();
        records.unshift(record);
        this.set(this.KEYS.RECORDS, records);
        return record;
    },

    updateRecord(id, updates) {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === id);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(this.KEYS.RECORDS, records);
            return records[index];
        }
        return null;
    },

    deleteRecord(id) {
        const records = this.getRecords();
        const filtered = records.filter(r => r.id !== id);
        this.set(this.KEYS.RECORDS, filtered);
        return filtered.length < records.length;
    },

    // ===== Bankroll =====
    getBankroll() {
        return this.get(this.KEYS.BANKROLL) || {
            initial: 0,
            current: 0,
            stopLoss: 0,
            profitTarget: 0,
            maxBetPercent: 10,
            history: []
        };
    },

    updateBankroll(data) {
        const bankroll = this.getBankroll();
        const updated = { ...bankroll, ...data };
        this.set(this.KEYS.BANKROLL, updated);
        return updated;
    },

    addBankrollHistory(amount, type, note = '') {
        const bankroll = this.getBankroll();
        bankroll.history = bankroll.history || [];
        bankroll.history.push({
            amount,
            type, // 'deposit', 'withdraw', 'bet', 'win', 'adjustment'
            balance: bankroll.current,
            note,
            date: new Date().toISOString()
        });
        this.set(this.KEYS.BANKROLL, bankroll);
    },

    // ===== API Config =====
    getApiConfig() {
        return this.get(this.KEYS.API_CONFIG) || {
            type: 'custom',
            baseUrl: '',
            apiKey: '',
            headers: {},
            connected: false,
            lastChecked: null
        };
    },

    updateApiConfig(data) {
        const config = this.getApiConfig();
        const updated = { ...config, ...data };
        this.set(this.KEYS.API_CONFIG, updated);
        return updated;
    },

    // ===== Settings =====
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            theme: 'dark',
            language: 'zh-CN'
        };
    },

    updateSettings(data) {
        const settings = this.getSettings();
        const updated = { ...settings, ...data };
        this.set(this.KEYS.SETTINGS, updated);
        return updated;
    },

    // ===== Statistics =====
    getStatistics() {
        const records = this.getRecords();
        const settled = records.filter(r => r.result === 'win' || r.result === 'lose');
        const wins = settled.filter(r => r.result === 'win');
        const totalStake = settled.reduce((sum, r) => sum + (r.stake || 0), 0);
        const totalPnl = settled.reduce((sum, r) => sum + (r.pnl || 0), 0);

        return {
            totalBets: records.length,
            settledBets: settled.length,
            pendingBets: records.filter(r => r.result === 'pending').length,
            wins: wins.length,
            losses: settled.length - wins.length,
            winRate: settled.length > 0 ? (wins.length / settled.length) * 100 : 0,
            totalStake,
            totalPnl,
            roi: totalStake > 0 ? (totalPnl / totalStake) * 100 : 0,
            avgOdds: settled.length > 0 ? settled.reduce((sum, r) => sum + (r.odds || 0), 0) / settled.length : 0
        };
    },

    // ===== Export All Data =====
    exportAllData() {
        return {
            records: this.getRecords(),
            bankroll: this.getBankroll(),
            apiConfig: this.getApiConfig(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },

    // ===== Import Data =====
    importData(data) {
        if (data.records) this.set(this.KEYS.RECORDS, data.records);
        if (data.bankroll) this.set(this.KEYS.BANKROLL, data.bankroll);
        if (data.apiConfig) this.set(this.KEYS.API_CONFIG, data.apiConfig);
        if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
        return true;
    },

    // ===== Clear All Data =====
    clearAll() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    }
};
