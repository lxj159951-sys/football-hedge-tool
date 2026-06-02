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
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isFile = protocol === 'file:';
        const isVercel = hostname.includes('vercel.app');
        const isGitHubPages = hostname.includes('github.io');

        console.log('Environment:', { hostname, protocol, isLocalhost, isFile, isVercel, isGitHubPages });

        // 本地环境或文件协议 - 使用本地代理
        if (isLocalhost || isFile) {
            this.PROXY_CONFIG.useProxy = true;
            this.PROXY_CONFIG.currentProxy = this.PROXY_CONFIG.local;
            console.log('Using local proxy:', this.PROXY_CONFIG.local);
        }
        // Vercel 环境 - 使用 Vercel 代理
        else if (isVercel) {
            this.PROXY_CONFIG.useProxy = true;
            this.PROXY_CONFIG.currentProxy = this.PROXY_CONFIG.vercel;
            console.log('Using Vercel proxy');
        }
        // GitHub Pages - 不使用代理（需要 CORS 扩展或强制连接）
        else if (isGitHubPages) {
            this.PROXY_CONFIG.useProxy = false;
            console.log('GitHub Pages detected, proxy disabled');
        }
        // 其他环境 - 默认使用代理
        else {
            this.PROXY_CONFIG.useProxy = true;
            this.PROXY_CONFIG.currentProxy = this.PROXY_CONFIG.local;
            console.log('Using default proxy');
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

        // 检测是否在 Vercel 环境
        const hostname = window.location.hostname;
        const isVercel = hostname.includes('vercel.app');

        // 如果是 Vercel 环境或没有配置，自动设置默认配置
        if (!config.type || isVercel) {
            const newConfig = {
                type: 'rapidapi',
                baseUrl: this.RAPIDAPI_DEFAULTS.baseUrl,
                apiKey: config.apiKey || defaultApiKey,
                headers: config.headers || defaultHeaders,
                connected: true,
                lastChecked: new Date().toISOString()
            };
            Store.updateApiConfig(newConfig);
            // 更新 config 变量
            Object.assign(config, newConfig);
        }

        document.getElementById('apiType').value = config.type || 'rapidapi';
        document.getElementById('apiBaseUrl').value = config.baseUrl || this.RAPIDAPI_DEFAULTS.baseUrl;
        document.getElementById('apiKey').value = config.apiKey || defaultApiKey;
        document.getElementById('apiHeaders').value = config.headers
            ? JSON.stringify(config.headers, null, 2)
            : JSON.stringify(defaultHeaders, null, 2);

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
            let testUrl;
            const headers = {
                'Content-Type': 'application/json'
            };

            // 使用代理测试
            if (this.PROXY_CONFIG.useProxy && this.PROXY_CONFIG.currentProxy) {
                // 通过代理测试
                testUrl = `${this.PROXY_CONFIG.currentProxy}?endpoint=matches/live`;
                if (apiKey) {
                    headers['x-rapidapi-key'] = apiKey;
                }
                console.log('Testing via proxy:', testUrl);
            } else {
                // 直接测试
                if (type === 'rapidapi') {
                    headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
                    headers['x-rapidapi-key'] = apiKey;
                    testUrl = `${baseUrl}/matches/live`;
                } else {
                    testUrl = baseUrl;
                }
                console.log('Testing direct:', testUrl);
            }

            const response = await fetch(testUrl, {
                method: 'GET',
                headers
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

        let urlStr;
        let headers = {
            'Content-Type': 'application/json'
        };

        // 使用代理模式
        if (this.PROXY_CONFIG.useProxy && this.PROXY_CONFIG.currentProxy) {
            // 通过代理请求 - 使用字符串拼接避免 URL 构造函数问题
            const proxyBase = this.PROXY_CONFIG.currentProxy;
            const queryParams = new URLSearchParams();
            queryParams.append('endpoint', endpoint);
            Object.entries(params).forEach(([key, value]) => {
                queryParams.append(key, value);
            });
            urlStr = `${proxyBase}?${queryParams.toString()}`;

            // 传递 API Key 给代理
            if (config.apiKey) {
                headers['x-rapidapi-key'] = config.apiKey;
            }
        } else {
            // 直接请求（可能遇到 CORS 限制）
            const baseUrl = config.baseUrl;
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                queryParams.append(key, value);
            });
            urlStr = queryParams.toString()
                ? `${baseUrl}/${endpoint}?${queryParams.toString()}`
                : `${baseUrl}/${endpoint}`;

            // For RapidAPI
            if (config.type === 'rapidapi') {
                headers['x-rapidapi-host'] = this.RAPIDAPI_DEFAULTS.host;
                headers['x-rapidapi-key'] = config.apiKey;
            }
        }

        console.log('API Request:', urlStr);

        const response = await fetch(urlStr, {
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
