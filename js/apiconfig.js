// ===== API Configuration =====

const ApiConfig = {
    init() {
        this.bindEvents();
        this.loadConfig();
    },

    bindEvents() {
        // Toggle API key visibility
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVisibility());

        // Test connection
        document.getElementById('testApiConnection').addEventListener('click', () => this.testConnection());

        // Save config
        document.getElementById('saveApiConfig').addEventListener('click', () => this.saveConfig());
    },

    loadConfig() {
        const config = Store.getApiConfig();

        document.getElementById('apiType').value = config.type || 'custom';
        document.getElementById('apiBaseUrl').value = config.baseUrl || '';
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('apiHeaders').value = config.headers ? JSON.stringify(config.headers, null, 2) : '';

        this.updateStatus(config);
    },

    saveConfig() {
        const type = document.getElementById('apiType').value;
        const baseUrl = document.getElementById('apiBaseUrl').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();
        const headersStr = document.getElementById('apiHeaders').value.trim();

        // Parse headers
        let headers = {};
        if (headersStr) {
            try {
                headers = JSON.parse(headersStr);
            } catch (e) {
                Utils.showToast('请求头格式错误，请使用 JSON 格式', 'error');
                return;
            }
        }

        Store.updateApiConfig({
            type,
            baseUrl,
            apiKey,
            headers,
            connected: false,
            lastChecked: null
        });

        Utils.showToast('API 配置已保存', 'success');
        this.loadConfig();
    },

    async testConnection() {
        const baseUrl = document.getElementById('apiBaseUrl').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();

        if (!baseUrl) {
            Utils.showToast('请输入 API 基础地址', 'error');
            return;
        }

        // Show testing state
        const statusBody = document.getElementById('apiStatusBody');
        statusBody.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在测试连接...</p>
        `;
        statusBody.className = 'api-status-body';

        try {
            // Try to fetch from the API
            const testUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            const headers = {
                'Content-Type': 'application/json'
            };

            if (apiKey) {
                headers['X-Auth-Token'] = apiKey;
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            // Add custom headers
            const customHeadersStr = document.getElementById('apiHeaders').value.trim();
            if (customHeadersStr) {
                try {
                    const customHeaders = JSON.parse(customHeadersStr);
                    Object.assign(headers, customHeaders);
                } catch (e) {
                    // Ignore parse errors
                }
            }

            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                mode: 'cors',
                timeout: 10000
            });

            if (response.ok) {
                // Success
                Store.updateApiConfig({
                    connected: true,
                    lastChecked: new Date().toISOString()
                });

                this.updateStatus({
                    connected: true,
                    lastChecked: new Date().toISOString()
                });

                Utils.showToast('API 连接成功！', 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('API test error:', error);

            Store.updateApiConfig({
                connected: false,
                lastChecked: new Date().toISOString()
            });

            this.updateStatus({
                connected: false,
                lastChecked: new Date().toISOString(),
                error: error.message
            });

            // Check if it's a CORS error
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                Utils.showToast('连接失败：可能是 CORS 限制或网络问题', 'error');
            } else {
                Utils.showToast(`连接失败：${error.message}`, 'error');
            }
        }
    },

    updateStatus(config) {
        const statusBody = document.getElementById('apiStatusBody');
        const connectionBadge = document.getElementById('apiConnectionStatus');
        const sidebarStatus = document.getElementById('apiStatus');

        if (config.connected) {
            statusBody.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                <p style="color: var(--success);">API 已连接</p>
                <p style="font-size: 12px; color: var(--text-muted);">
                    上次检查：${config.lastChecked ? Utils.formatDateTime(config.lastChecked) : '未知'}
                </p>
            `;
            statusBody.className = 'api-status-body connected';

            connectionBadge.textContent = '已连接';
            connectionBadge.className = 'badge online';

            sidebarStatus.innerHTML = `
                <span class="status-dot online"></span>
                <span>API 已连接</span>
            `;
        } else {
            statusBody.innerHTML = `
                <i class="fas fa-times-circle" style="color: var(--danger);"></i>
                <p style="color: var(--danger);">API 未连接</p>
                ${config.error ? `<p style="font-size: 12px; color: var(--text-muted);">${config.error}</p>` : ''}
                <p style="font-size: 12px; color: var(--text-muted);">请配置并测试连接</p>
            `;
            statusBody.className = 'api-status-body disconnected';

            connectionBadge.textContent = '未连接';
            connectionBadge.className = 'badge offline';

            sidebarStatus.innerHTML = `
                <span class="status-dot offline"></span>
                <span>API 未连接</span>
            `;
        }
    },

    toggleApiKeyVisibility() {
        const input = document.getElementById('apiKey');
        const icon = document.querySelector('#toggleApiKey i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    },

    // Make API request
    async makeRequest(endpoint, options = {}) {
        const config = Store.getApiConfig();

        if (!config.connected || !config.baseUrl) {
            throw new Error('API 未连接');
        }

        const url = config.baseUrl.endsWith('/')
            ? config.baseUrl + endpoint
            : config.baseUrl + '/' + endpoint;

        const headers = {
            'Content-Type': 'application/json',
            ...config.headers
        };

        if (config.apiKey) {
            headers['X-Auth-Token'] = config.apiKey;
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    },

    // Check if API is connected
    isConnected() {
        const config = Store.getApiConfig();
        return config.connected === true;
    }
};
