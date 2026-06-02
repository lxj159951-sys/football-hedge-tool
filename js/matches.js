// ===== Matches Module =====

const Matches = {
    init() {
        this.bindEvents();
        this.loadMatches();
    },

    bindEvents() {
        // Refresh matches
        document.getElementById('refreshMatches')?.addEventListener('click', () => this.loadMatches());

        // Search team
        document.getElementById('searchTeamBtn')?.addEventListener('click', () => this.searchTeam());
        document.getElementById('teamSearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchTeam();
        });
    },

    async loadMatches() {
        const container = document.getElementById('matchesContainer');
        if (!container) return;

        const apiConfig = Store.getApiConfig();

        if (!apiConfig.connected) {
            container.innerHTML = `
                <div class="api-notice">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>API 未连接，请先配置 API</span>
                </div>
            `;
            return;
        }

        // Show loading
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在加载比赛数据...</p>
            </div>
        `;

        try {
            // 获取实时比赛数据
            const liveData = await ApiConfig.getLiveMatches();

            if (liveData && liveData.events && liveData.events.length > 0) {
                this.displayLiveMatches(liveData.events, container);
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-futbol"></i>
                        <p>当前没有正在进行的比赛</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load matches error:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>加载失败：${error.message}</p>
                    <button class="btn btn-sm" onclick="Matches.loadMatches()">重试</button>
                </div>
            `;
        }
    },

    displayLiveMatches(events, container) {
        // 按联赛分组
        const groupedByTournament = {};
        events.forEach(event => {
            const tournamentName = event.tournament?.name || '其他联赛';
            if (!groupedByTournament[tournamentName]) {
                groupedByTournament[tournamentName] = {
                    info: event.tournament,
                    matches: []
                };
            }
            groupedByTournament[tournamentName].matches.push(event);
        });

        const tournaments = Object.entries(groupedByTournament).slice(0, 5); // 只显示前5个联赛

        container.innerHTML = `
            <div class="matches-header">
                <h3><i class="fas fa-futbol"></i> 实时比赛</h3>
                <span class="badge online">LIVE</span>
            </div>

            <div class="matches-list">
                ${tournaments.map(([name, data]) => `
                    <div class="tournament-group">
                        <div class="tournament-header">
                            <span class="tournament-flag">${this.getCountryFlag(data.info?.category?.slug)}</span>
                            <span class="tournament-name">${name}</span>
                            <span class="match-count">${data.matches.length} 场</span>
                        </div>
                        ${data.matches.slice(0, 3).map(match => this.renderMatchCard(match)).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderMatchCard(match) {
        const homeTeam = match.homeTeam || {};
        const awayTeam = match.awayTeam || {};
        const status = match.status || {};
        const homeScore = match.homeScore?.current || '-';
        const awayScore = match.awayScore?.current || '-';
        const minute = status.description || '';

        const isLive = status.type === 'inprogress';
        const isFinished = status.type === 'finished';

        return `
            <div class="match-card ${isLive ? 'live' : ''} ${isFinished ? 'finished' : ''}">
                <div class="match-content">
                    <div class="match-teams">
                        <div class="team home">
                            <span class="team-name">${homeTeam.name || '主队'}</span>
                            <span class="team-code">${homeTeam.nameCode || ''}</span>
                        </div>
                        <div class="match-score">
                            <span class="score">${homeScore}</span>
                            <span class="score-divider">-</span>
                            <span class="score">${awayScore}</span>
                        </div>
                        <div class="team away">
                            <span class="team-code">${awayTeam.nameCode || ''}</span>
                            <span class="team-name">${awayTeam.name || '客队'}</span>
                        </div>
                    </div>
                    <div class="match-status">
                        ${isLive ? `<span class="live-badge"><span class="pulse"></span> ${minute}</span>` : ''}
                        ${isFinished ? '<span class="finished-badge">完场</span>' : ''}
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn btn-sm" onclick="Matches.viewMatchDetail(${match.id})">
                        <i class="fas fa-chart-bar"></i> 详情
                    </button>
                    <button class="btn btn-sm" onclick="Matches.analyzeMatch('${homeTeam.name}', '${awayTeam.name}')">
                        <i class="fas fa-brain"></i> 分析
                    </button>
                    <button class="btn btn-sm" onclick="Matches.addToRecords('${homeTeam.name} vs ${awayTeam.name}')">
                        <i class="fas fa-plus"></i> 记录
                    </button>
                </div>
            </div>
        `;
    },

    getCountryFlag(slug) {
        const flags = {
            'argentina': '🇦🇷',
            'brazil': '🇧🇷',
            'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
            'spain': '🇪🇸',
            'germany': '🇩🇪',
            'france': '🇫🇷',
            'italy': '🇮🇹',
            'china': '🇨🇳',
            'japan': '🇯🇵',
            'usa': '🇺🇸'
        };
        return flags[slug] || '⚽';
    },

    async viewMatchDetail(matchId) {
        try {
            Utils.showToast('正在加载比赛详情...', 'info');
            const detail = await ApiConfig.getMatchDetail(matchId);

            if (detail) {
                // 可以显示一个弹窗或跳转到详情页
                console.log('Match detail:', detail);
                Utils.showToast('比赛详情已加载', 'success');
            }
        } catch (error) {
            console.error('Get match detail error:', error);
            Utils.showToast('加载详情失败', 'error');
        }
    },

    analyzeMatch(homeTeam, awayTeam) {
        // 跳转到智能预测页面
        App.switchTab('prediction');
        document.getElementById('homeTeamName').value = homeTeam;
        document.getElementById('awayTeamName').value = awayTeam;
        Utils.showToast(`正在分析：${homeTeam} vs ${awayTeam}`, 'info');
    },

    addToRecords(matchName) {
        // 打开投注记录弹窗
        Records.openModal();
        document.getElementById('recordMatch').value = matchName;
    },

    async searchTeam() {
        const input = document.getElementById('teamSearchInput');
        const query = input?.value.trim();

        if (!query) {
            Utils.showToast('请输入球队名称', 'warning');
            return;
        }

        const apiConfig = Store.getApiConfig();
        if (!apiConfig.connected) {
            Utils.showToast('请先配置 API', 'warning');
            return;
        }

        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在搜索...</p>
            </div>
        `;

        try {
            const result = await ApiConfig.searchTeam(query);

            if (result && result.events && result.events.length > 0) {
                resultsContainer.innerHTML = `
                    <div class="search-results-list">
                        <h4>搜索结果 (${result.events.length})</h4>
                        ${result.events.slice(0, 10).map(event => `
                            <div class="search-result-item" onclick="Matches.selectTeam(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                                <div class="team-info">
                                    <span class="team-name">${event.homeTeam?.name || ''} vs ${event.awayTeam?.name || ''}</span>
                                    <span class="team-league">${event.tournament?.name || ''}</span>
                                </div>
                                <span class="match-time">${event.startTimestamp ? new Date(event.startTimestamp * 1000).toLocaleDateString() : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>未找到相关比赛</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>搜索失败：${error.message}</p>
                </div>
            `;
        }
    },

    selectTeam(event) {
        const matchName = `${event.homeTeam?.name || ''} vs ${event.awayTeam?.name || ''}`;
        Utils.showToast(`已选择：${matchName}`, 'success');
    }
};
