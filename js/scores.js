// ===== 实时比分模块 =====

const Scores = {
    matches: [],
    refreshTimer: null,
    filter: 'all',

    init() {
        this.bindEvents();
        this.loadScores();
    },

    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshScores');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadScores());
        }

        // 筛选按钮
        const filterBtns = document.querySelectorAll('.scores-filter .btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 更新按钮状态
                filterBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
                filterBtns.forEach(b => b.classList.add('btn-secondary'));
                e.target.classList.add('active', 'btn-primary');
                e.target.classList.remove('btn-secondary');

                // 应用筛选
                this.filter = e.target.dataset.filter;
                this.renderScores();
            });
        });
    },

    async loadScores() {
        const container = document.getElementById('scoresContainer');
        if (!container) return;

        // 检查 API 配置
        const apiConfig = Store.getApiConfig();
        if (!apiConfig.connected) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <p>请先配置 API 连接以获取实时比分</p>
                    <button class="btn btn-primary btn-sm" onclick="App.switchTab('apiconfig')">
                        <i class="fas fa-cog"></i> 配置 API
                    </button>
                </div>
            `;
            return;
        }

        // 显示加载状态
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在加载比分数据...</p>
            </div>
        `;

        try {
            // 尝试从 API 获取数据
            const data = await this.fetchScores();
            this.matches = data || [];
            this.renderScores();
        } catch (error) {
            console.error('加载比分失败:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载比分数据失败</p>
                    <p class="error-desc">${error.message || '请检查 API 配置'}</p>
                    <button class="btn btn-primary btn-sm" onclick="Scores.loadScores()">
                        <i class="fas fa-sync-alt"></i> 重试
                    </button>
                </div>
            `;
        }
    },

    async fetchScores() {
        // 这里应该调用实际的 API
        // 由于我们使用代理，可以尝试从代理获取
        const apiConfig = Store.getApiConfig();

        // 示例：返回模拟数据
        // 实际项目中应该调用真实的 API
        return this.getMockData();
    },

    getMockData() {
        // 模拟数据，实际项目中应该从 API 获取
        return [
            {
                id: 1,
                league: '英超',
                leagueLogo: '',
                homeTeam: '曼联',
                awayTeam: '利物浦',
                homeScore: 2,
                awayScore: 1,
                minute: 75,
                status: 'LIVE'
            },
            {
                id: 2,
                league: '英超',
                leagueLogo: '',
                homeTeam: '切尔西',
                awayTeam: '阿森纳',
                homeScore: 0,
                awayScore: 0,
                minute: 30,
                status: 'LIVE'
            },
            {
                id: 3,
                league: '西甲',
                leagueLogo: '',
                homeTeam: '巴塞罗那',
                awayTeam: '皇家马德里',
                homeScore: null,
                awayScore: null,
                minute: null,
                status: 'UPCOMING'
            },
            {
                id: 4,
                league: '德甲',
                leagueLogo: '',
                homeTeam: '拜仁慕尼黑',
                awayTeam: '多特蒙德',
                homeScore: 3,
                awayScore: 2,
                minute: 90,
                status: 'FINISHED'
            }
        ];
    },

    getFilteredMatches() {
        if (this.filter === 'all') {
            return this.matches;
        }

        return this.matches.filter(match => {
            switch (this.filter) {
                case 'live':
                    return match.status === 'LIVE';
                case 'upcoming':
                    return match.status === 'UPCOMING';
                case 'finished':
                    return match.status === 'FINISHED';
                default:
                    return true;
            }
        });
    },

    renderScores() {
        const container = document.getElementById('scoresContainer');
        if (!container) return;

        const filteredMatches = this.getFilteredMatches();

        if (filteredMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <p>暂无${this.filter === 'live' ? '进行中的' : this.filter === 'upcoming' ? '未开始的' : this.filter === 'finished' ? '已结束的' : ''}比赛</p>
                </div>
            `;
            return;
        }

        // 按联赛分组
        const grouped = this.groupByLeague(filteredMatches);

        container.innerHTML = Object.entries(grouped).map(([league, matches]) => `
            <div class="league-section">
                <div class="league-header">
                    <span>${Utils.escapeHtml(league)}</span>
                    <span class="match-count">${matches.length} 场</span>
                </div>
                ${matches.map(match => this.renderMatchCard(match)).join('')}
            </div>
        `).join('');
    },

    groupByLeague(matches) {
        return matches.reduce((groups, match) => {
            const league = match.league || '其他';
            if (!groups[league]) {
                groups[league] = [];
            }
            groups[league].push(match);
            return groups;
        }, {});
    },

    renderMatchCard(match) {
        const isLive = match.status === 'LIVE';
        const isUpcoming = match.status === 'UPCOMING';
        const isFinished = match.status === 'FINISHED';

        const statusText = isLive ? `${match.minute}'` : isUpcoming ? '未开始' : '已结束';
        const scoreText = isUpcoming ? 'VS' : `${match.homeScore} - ${match.awayScore}`;

        return `
            <div class="match-card ${isLive ? 'live' : ''}">
                <div class="match-teams">
                    <span class="home-team">${Utils.escapeHtml(match.homeTeam)}</span>
                    <span class="score">${scoreText}</span>
                    <span class="away-team">${Utils.escapeHtml(match.awayTeam)}</span>
                </div>
                <div class="match-info">
                    <span class="match-time ${isLive ? 'live' : ''}">${statusText}</span>
                    <span class="match-status">${match.status}</span>
                </div>
            </div>
        `;
    },

    startAutoRefresh(interval = 60000) {
        this.stopAutoRefresh();
        this.refreshTimer = setInterval(() => this.loadScores(), interval);
    },

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
};
