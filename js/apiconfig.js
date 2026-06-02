// ===== API Configuration =====

const ApiConfig = {
    // RapidAPI default config - 使用 footapi7（功能更全）
    RAPIDAPI_DEFAULTS: {
        host: 'footapi7.p.rapidapi.com',
        baseUrl: 'https://footapi7.p.rapidapi.com'
    },

    // Proxy config (解决 CORS 问题)
    PROXY_CONFIG: {
        // 本地代理地址
        local: 'http://localhost:3001',
        // Vercel 代理地址（部署后自动生效）
        vercel: '/api/proxy',
        // 是否启用代理
        useProxy: true
    },

    init() {
        this.bindEvents();
        this.loadConfig();
        this.detectEnvironment();
    },

    // 检测运行环境
    detectEnvironment() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isVercel = window.location.hostname.includes('vercel.app');

        if (isLocal) {
            this.PROXY_CONFIG.currentProxy = this.PROXY_CONFIG.local;
        } else if (isVercel) {
            this.PROXY_CONFIG.currentProxy = this.PROXY_CONFIG.vercel;
        } else {
            // GitHub Pages 或其他环境，不使用代理
            this.PROXY_CONFIG.useProxy = false;
        }
    },

    bindEvents() {
        // Toggle API key visibility
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVisibility());

        // Test connection
        document.getElementById('testApiConnection').addEventListener('click', () => this.testConnection());

        // Force connect
        document.getElementById('forceConnect').addEventListener('click', () => this.forceConnect());

        // Save config
        document.getElementById('saveApiConfig').addEventListener('click', () => this.saveConfig());

        // API type change
        document.getElementById('apiType').addEventListener('change', (e) => this.onTypeChange(e.target.value));
    },

    onTypeChange(type) {
        if (type === 'rapidapi') {
            document.getElementById('apiBaseUrl').value = this.RAPIDAPI_DEFAULTS.baseUrl;
            document.getElementById('apiHeaders').value = JSON.stringify({
                'x-rapidapi-host': this.RAPIDAPI_DEFAULTS.host
            }, null, 2);
        }
    },

    loadConfig() {
        const config = Store.getApiConfig();

        // Default values for RapidAPI
        const defaultApiKey = '3578074cb7msh73f3a9e20e60e06p1fe94fjsnc36c0746bd2e';
        const defaultHeaders = {
            'x-rapidapi-host': this.RAPIDAPI_DEFAULTS.host,
            'x-rapidapi-key': defaultApiKey
        };

        document.getElementById('apiType').value = config.type || 'rapidapi';
        document.getElementById('apiBaseUrl').value = config.baseUrl || this.RAPIDAPI_DEFAULTS.baseUrl;
        document.getElementById('apiKey').value = config.apiKey || defaultApiKey;
        document.getElementById('apiHeaders').value = config.headers
            ? JSON.stringify(config.headers, null, 2)
            : JSON.stringify(defaultHeaders, null, 2);

        // If no config saved yet, auto-save with defaults
        if (!config.type) {
            Store.updateApiConfig({
                type: 'rapidapi',
                baseUrl: this.RAPIDAPI_DEFAULTS.baseUrl,
                apiKey: defaultApiKey,
                headers: defaultHeaders,
                connected: true,
                lastChecked: new Date().toISOString()
            });
        }

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

        // For RapidAPI, ensure the host header is set
        if (type === 'rapidapi') {
            headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
            headers['x-rapidapi-key'] = apiKey;
        }

        Store.updateApiConfig({
            type,
            baseUrl,
            apiKey,
            headers,
            connected: true,
            lastChecked: new Date().toISOString()
        });

        // Enable load button
        const loadBtn = document.getElementById('loadTeamData');
        if (loadBtn) loadBtn.disabled = false;

        Utils.showToast('API 配置已保存并连接！', 'success');
        this.loadConfig();
    },

    async testConnection() {
        const type = document.getElementById('apiType').value;
        const baseUrl = document.getElementById('apiBaseUrl').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();

        if (!baseUrl) {
            Utils.showToast('请输入 API 基础地址', 'error');
            return;
        }

        if (type === 'rapidapi' && !apiKey) {
            Utils.showToast('请输入 RapidAPI Key', 'error');
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
            // Build headers
            const headers = {
                'Content-Type': 'application/json'
            };

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

            // For RapidAPI
            if (type === 'rapidapi') {
                headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
                headers['x-rapidapi-key'] = apiKey;
            }

            // Test with a simple endpoint
            const testUrl = type === 'rapidapi'
                ? `${baseUrl}/football-players-search?search=test`
                : baseUrl;

            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();

                // Save connected state
                Store.updateApiConfig({
                    type,
                    baseUrl,
                    apiKey,
                    headers,
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
                Utils.showToast('连接失败：浏览器 CORS 限制，请使用后端代理或 CORS 扩展', 'error');
            } else {
                Utils.showToast(`连接失败：${error.message}`, 'error');
            }
        }
    },

    forceConnect() {
        const type = document.getElementById('apiType').value;
        const baseUrl = document.getElementById('apiBaseUrl').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();
        const headersStr = document.getElementById('apiHeaders').value.trim();

        if (!baseUrl) {
            Utils.showToast('请输入 API 基础地址', 'error');
            return;
        }

        // Parse headers
        let headers = {};
        if (headersStr) {
            try {
                headers = JSON.parse(headersStr);
            } catch (e) {
                // Ignore
            }
        }

        // For RapidAPI
        if (type === 'rapidapi') {
            headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
            headers['x-rapidapi-key'] = apiKey;
        }

        // Force save as connected
        Store.updateApiConfig({
            type,
            baseUrl,
            apiKey,
            headers,
            connected: true,
            lastChecked: new Date().toISOString()
        });

        this.updateStatus({
            connected: true,
            lastChecked: new Date().toISOString()
        });

        // Enable load button
        const loadBtn = document.getElementById('loadTeamData');
        if (loadBtn) loadBtn.disabled = false;

        Utils.showToast('API 已强制连接！（如遇 CORS 限制，请安装 CORS 扩展）', 'success');
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

    // Make API request (with proxy support)
    async makeRequest(endpoint, params = {}) {
        const config = Store.getApiConfig();

        if (!config.connected || !config.baseUrl) {
            throw new Error('API 未连接');
        }

        let url;
        let headers = {
            'Content-Type': 'application/json'
        };

        // 使用代理模式
        if (this.PROXY_CONFIG.useProxy && this.PROXY_CONFIG.currentProxy) {
            // 通过代理请求
            url = new URL(this.PROXY_CONFIG.currentProxy);
            url.searchParams.append('endpoint', endpoint);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            // 传递 API Key 给代理
            if (config.apiKey) {
                headers['x-rapidapi-key'] = config.apiKey;
            }
        } else {
            // 直接请求（可能遇到 CORS 限制）
            url = new URL(config.baseUrl + '/' + endpoint);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            // For RapidAPI
            if (config.type === 'rapidapi') {
                headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
                headers['x-rapidapi-key'] = config.apiKey;
            }
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    },

    // Search players
    async searchPlayers(query) {
        return this.makeRequest('football-players-search', { search: query });
    },

    // 获取实时比赛
    async getLiveMatches() {
        return this.makeRequest('matches/live');
    },

    // 获取比赛详情
    async getMatchDetail(matchId) {
        return this.makeRequest(`match/${matchId}`);
    },

    // 获取比赛射门数据
    async getMatchShotmap(matchId) {
        return this.makeRequest(`match/${matchId}/shotmap`);
    },

    // 搜索球队/比赛
    async searchTeam(query) {
        return this.makeRequest('search', { query });
    },

    // 获取球队信息
    async getTeamInfo(teamId) {
        return this.makeRequest(`team/${teamId}`);
    },

    // 获取联赛积分榜
    async getStandings(tournamentId, seasonId) {
        return this.makeRequest(`tournament/${tournamentId}/season/${seasonId}/standings/total`);
    },

    // Check if API is connected
    isConnected() {
        const config = Store.getApiConfig();
        return config.connected === true;
    }
};
