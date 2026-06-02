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
            // Try to get data from API
            // Note: This API only supports player search, so we'll show sample data
            // In production, replace with a real matches API

            // Search for popular teams to show some data
            const teams = ['Manchester United', 'Liverpool', 'Real Madrid', 'Barcelona', 'Bayern'];
            const allPlayers = [];

            for (const team of teams.slice(0, 2)) {
                try {
                    const result = await ApiConfig.searchPlayers(team);
                    if (result && result.response && result.response.suggestions) {
                        allPlayers.push(...result.response.suggestions.filter(s => s.type === 'player'));
                    }
                } catch (e) {
                    console.warn('Search error:', e);
                }
            }

            if (allPlayers.length > 0) {
                this.displayPlayerData(allPlayers, container);
            } else {
                this.displaySampleMatches(container);
            }
        } catch (error) {
            console.error('Load matches error:', error);
            this.displaySampleMatches(container);
        }
    },

    displayPlayerData(players, container) {
        const uniqueTeams = {};
        players.forEach(p => {
            if (p.teamName && !uniqueTeams[p.teamName]) {
                uniqueTeams[p.teamName] = {
                    teamId: p.teamId,
                    teamName: p.teamName,
                    players: []
                };
            }
            if (p.teamName) {
                uniqueTeams[p.teamName].players.push(p);
            }
        });

        const teams = Object.values(uniqueTeams).slice(0, 4);

        container.innerHTML = `
            <div class="matches-header">
                <h3><i class="fas fa-database"></i> API 数据</h3>
                <span class="badge online">实时数据</span>
            </div>

            <div class="teams-grid">
                ${teams.map(team => `
                    <div class="team-data-card">
                        <div class="team-header">
                            <div class="team-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="team-info">
                                <h4>${team.teamName}</h4>
                                <span class="team-id">ID: ${team.teamId}</span>
                            </div>
                        </div>
                        <div class="team-players">
                            <h5>球员列表</h5>
                            <ul>
                                ${team.players.slice(0, 5).map(p => `
                                    <li>
                                        <span class="player-name">${p.name}</span>
                                        <span class="player-id">#${p.id}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="api-notice" style="margin-top: 16px;">
                <i class="fas fa-info-circle"></i>
                <span>当前 API 支持球员搜索，比赛数据功能需要接入其他 API</span>
            </div>
        `;
    },

    displaySampleMatches(container) {
        // Sample match data for demonstration
        const sampleMatches = [
            {
                id: 1,
                league: '英超',
                homeTeam: '曼联',
                awayTeam: '利物浦',
                homeOdds: 2.10,
                drawOdds: 3.40,
                awayOdds: 3.20,
                time: '21:00',
                status: 'upcoming'
            },
            {
                id: 2,
                league: '西甲',
                homeTeam: '皇家马德里',
                awayTeam: '巴塞罗那',
                homeOdds: 1.95,
                drawOdds: 3.60,
                awayOdds: 3.50,
                time: '22:00',
                status: 'upcoming'
            },
            {
                id: 3,
                league: '德甲',
                homeTeam: '拜仁慕尼黑',
                awayTeam: '多特蒙德',
                homeOdds: 1.75,
                drawOdds: 3.80,
                awayOdds: 4.20,
                time: '23:00',
                status: 'upcoming'
            },
            {
                id: 4,
                league: '意甲',
                homeTeam: '国际米兰',
                awayTeam: 'AC米兰',
                homeOdds: 2.05,
                drawOdds: 3.30,
                awayOdds: 3.40,
                time: '20:45',
                status: 'live',
                score: '1-1',
                minute: '67'
            },
            {
                id: 5,
                league: '法甲',
                homeTeam: '巴黎圣日耳曼',
                awayTeam: '马赛',
                homeOdds: 1.50,
                drawOdds: 4.20,
                awayOdds: 5.50,
                time: '昨天',
                status: 'finished',
                score: '3-1'
            }
        ];

        container.innerHTML = `
            <div class="matches-header">
                <h3><i class="fas fa-futbol"></i> 比赛数据</h3>
                <span class="badge warning">示例数据</span>
            </div>

            <div class="matches-notice">
                <i class="fas fa-exclamation-triangle"></i>
                <p>当前显示示例数据，请配置比赛数据 API 以获取实时数据</p>
            </div>

            <div class="matches-list">
                ${sampleMatches.map(match => `
                    <div class="match-card ${match.status}">
                        <div class="match-league">${match.league}</div>
                        <div class="match-content">
                            <div class="match-teams">
                                <div class="team home">
                                    <span class="team-name">${match.homeTeam}</span>
                                    ${match.status === 'live' || match.status === 'finished'
                                        ? `<span class="team-score">${match.score.split('-')[0]}</span>`
                                        : ''
                                    }
                                </div>
                                <div class="match-vs">
                                    ${match.status === 'live'
                                        ? `<span class="live-badge">LIVE ${match.minute}'</span>`
                                        : match.status === 'finished'
                                            ? '<span class="finished-badge">完场</span>'
                                            : `<span class="time-badge">${match.time}</span>`
                                    }
                                </div>
                                <div class="team away">
                                    ${match.status === 'live' || match.status === 'finished'
                                        ? `<span class="team-score">${match.score.split('-')[1]}</span>`
                                        : ''
                                    }
                                    <span class="team-name">${match.awayTeam}</span>
                                </div>
                            </div>
                            <div class="match-odds">
                                <div class="odds-item" onclick="Matches.addToArbitrage('${match.homeTeam}', ${match.homeOdds})">
                                    <span class="odds-label">主</span>
                                    <span class="odds-value">${match.homeOdds}</span>
                                </div>
                                <div class="odds-item" onclick="Matches.addToArbitrage('平局', ${match.drawOdds})">
                                    <span class="odds-label">平</span>
                                    <span class="odds-value">${match.drawOdds}</span>
                                </div>
                                <div class="odds-item" onclick="Matches.addToArbitrage('${match.awayTeam}', ${match.awayOdds})">
                                    <span class="odds-label">客</span>
                                    <span class="odds-value">${match.awayOdds}</span>
                                </div>
                            </div>
                        </div>
                        <div class="match-actions">
                            <button class="btn btn-sm" onclick="Matches.analyzeMatch(${JSON.stringify(match).replace(/"/g, '&quot;')})">
                                <i class="fas fa-chart-bar"></i> 分析
                            </button>
                            <button class="btn btn-sm" onclick="Matches.addToRecords('${match.homeTeam} vs ${match.awayTeam}')">
                                <i class="fas fa-plus"></i> 记录
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
            const result = await ApiConfig.searchPlayers(query);

            if (result && result.response && result.response.suggestions) {
                const players = result.response.suggestions.filter(s => s.type === 'player');

                if (players.length > 0) {
                    resultsContainer.innerHTML = `
                        <div class="search-results-list">
                            <h4>搜索结果 (${players.length})</h4>
                            ${players.slice(0, 10).map(p => `
                                <div class="search-result-item">
                                    <div class="player-info">
                                        <span class="player-name">${p.name}</span>
                                        <span class="player-team">${p.teamName || '未知球队'}</span>
                                    </div>
                                    <button class="btn btn-sm" onclick="Matches.selectPlayer(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                                        选择
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>未找到相关球员</p>
                        </div>
                    `;
                }
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

    selectPlayer(player) {
        Utils.showToast(`已选择：${player.name} (${player.teamName})`, 'success');
        // You can add logic here to use the selected player
    },

    addToArbitrage(team, odds) {
        // Navigate to arbitrage calculator and pre-fill
        App.switchTab('arbitrage');
        Utils.showToast(`已添加 ${team} 赔率 ${odds} 到套利计算器`, 'info');
    },

    analyzeMatch(match) {
        // Navigate to prediction and pre-fill
        App.switchTab('prediction');
        document.getElementById('homeTeamName').value = match.homeTeam;
        document.getElementById('awayTeamName').value = match.awayTeam;
        Utils.showToast(`正在分析：${match.homeTeam} vs ${match.awayTeam}`, 'info');
    },

    addToRecords(matchName) {
        // Open record modal with match name pre-filled
        Records.openModal();
        document.getElementById('recordMatch').value = matchName;
    }
};
