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
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                        提示：如果是 API 代理问题，请尝试点击 "API 配置" → "强制连接"
                    </p>
                    <button class="btn btn-sm" onclick="Matches.loadMatches()">重试</button>
                </div>
            `;
        }
    },

    // 简化联赛名称
    shortenTournamentName(name) {
        if (!name) return '未知联赛';

        // 移除常见的前缀和后缀
        let shortName = name
            .replace(/^Camp\.\s*/i, '')
            .replace(/^De\s*/i, '')
            .replace(/^Reser\s*/i, '')
            .replace(/\s*De\s*/gi, ' ')
            .replace(/\s*Metropolitana/i, '')
            .replace(/\s*Reserves?/i, '')
            .replace(/\s*Reserve/i, '')
            .trim();

        // 如果还是太长，截取前20个字符
        if (shortName.length > 25) {
            shortName = shortName.substring(0, 22) + '...';
        }

        return shortName || '其他联赛';
    },

    // 获取国家旗帜
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
            'usa': '🇺🇸',
            'mexico': '🇲🇽',
            'colombia': '🇨🇴',
            'chile': '🇨🇱',
            'peru': '🇵🇪',
            'ecuador': '🇪🇨',
            'uruguay': '🇺🇾',
            'paraguay': '🇵🇾',
            'bolivia': '🇧🇴',
            'venezuela': '🇻🇪'
        };
        return flags[slug] || '⚽';
    },

    // 获取状态显示
    getStatusDisplay(status) {
        if (!status) return { text: '', class: '' };

        const type = status.type;
        const desc = status.description || '';

        if (type === 'inprogress') {
            return { text: desc || '进行中', class: 'live' };
        } else if (type === 'finished') {
            return { text: '完场', class: 'finished' };
        } else if (type === 'notstarted') {
            return { text: '未开始', class: 'upcoming' };
        } else {
            return { text: desc || type, class: '' };
        }
    },

    displayLiveMatches(events, container) {
        // 只显示足球比赛
        const footballEvents = events.filter(e =>
            e.tournament?.category?.sport?.slug === 'football' ||
            e.tournament?.category?.sport?.name === 'Football'
        );

        if (footballEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-futbol"></i>
                    <p>当前没有正在进行的足球比赛</p>
                </div>
            `;
            return;
        }

        // 按联赛分组
        const groupedByTournament = {};
        footballEvents.forEach(event => {
            const tournamentId = event.tournament?.id;
            if (!tournamentId) return;

            if (!groupedByTournament[tournamentId]) {
                groupedByTournament[tournamentId] = {
                    info: event.tournament,
                    matches: []
                };
            }
            groupedByTournament[tournamentId].matches.push(event);
        });

        // 按优先级排序联赛
        const tournaments = Object.entries(groupedByTournament)
            .sort((a, b) => (b[1].info?.priority || 0) - (a[1].info?.priority || 0))
            .slice(0, 8); // 只显示前8个联赛

        container.innerHTML = `
            <div class="matches-header">
                <h3><i class="fas fa-futbol"></i> 实时比赛</h3>
                <span class="badge online">${footballEvents.length} 场进行中</span>
            </div>

            <div class="matches-list">
                ${tournaments.map(([id, data]) => `
                    <div class="tournament-group">
                        <div class="tournament-header">
                            <span class="tournament-flag">${this.getCountryFlag(data.info?.category?.slug)}</span>
                            <span class="tournament-name">${this.shortenTournamentName(data.info?.name)}</span>
                            <span class="match-count">${data.matches.length} 场</span>
                        </div>
                        ${data.matches.slice(0, 5).map(match => this.renderMatchCard(match)).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderMatchCard(match) {
        const homeTeam = match.homeTeam || {};
        const awayTeam = match.awayTeam || {};
        const status = match.status || {};
        const homeScore = match.homeScore?.current ?? match.homeScore?.display ?? '-';
        const awayScore = match.awayScore?.current ?? match.awayScore?.display ?? '-';
        const statusInfo = this.getStatusDisplay(status);

        // 获取比赛时间
        let timeDisplay = '';
        if (status.type === 'inprogress' && match.time) {
            const minutes = Math.floor((match.time.currentPeriodStartTimestamp || 0) / 60);
            timeDisplay = `${minutes}'`;
        }

        // 获取球队名称（优先使用短名称）
        const homeName = Utils.escapeHtml(homeTeam.shortName || homeTeam.name || '主队');
        const awayName = Utils.escapeHtml(awayTeam.shortName || awayTeam.name || '客队');

        // 获取球队代码
        const homeCode = Utils.escapeHtml(homeTeam.nameCode || '');
        const awayCode = Utils.escapeHtml(awayTeam.nameCode || '');

        // 获取完整名称（用于 title 属性）
        const homeFullName = Utils.escapeHtml(homeTeam.name || '');
        const awayFullName = Utils.escapeHtml(awayTeam.name || '');

        return `
            <div class="match-card ${statusInfo.class}">
                <div class="match-content">
                    <div class="match-teams">
                        <div class="team home">
                            <span class="team-name" title="${homeFullName}">${homeName}</span>
                            ${homeCode ? `<span class="team-code">${homeCode}</span>` : ''}
                        </div>
                        <div class="match-score">
                            <span class="score">${homeScore}</span>
                            <span class="score-divider">-</span>
                            <span class="score">${awayScore}</span>
                        </div>
                        <div class="team away">
                            ${awayCode ? `<span class="team-code">${awayCode}</span>` : ''}
                            <span class="team-name" title="${awayFullName}">${awayName}</span>
                        </div>
                    </div>
                    <div class="match-status">
                        ${statusInfo.class === 'live'
                            ? `<span class="live-badge"><span class="pulse"></span> ${statusInfo.text}</span>`
                            : statusInfo.class === 'finished'
                                ? `<span class="finished-badge">${statusInfo.text}</span>`
                                : `<span class="time-badge">${statusInfo.text}</span>`
                        }
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn btn-sm" onclick="Matches.viewMatchDetail(${match.id})">
                        <i class="fas fa-chart-bar"></i> 详情
                    </button>
                    <button class="btn btn-sm" onclick="Matches.analyzeMatch('${homeFullName.replace(/'/g, "\\'")}', '${awayFullName.replace(/'/g, "\\'")}')">
                        <i class="fas fa-brain"></i> 分析
                    </button>
                    <button class="btn btn-sm" onclick="Matches.addToRecords('${homeName} vs ${awayName}')">
                        <i class="fas fa-plus"></i> 记录
                    </button>
                </div>
            </div>
        `;
    },

    async viewMatchDetail(matchId) {
        try {
            Utils.showToast('正在加载比赛详情...', 'info');
            const detail = await ApiConfig.getMatchDetail(matchId);

            if (detail && detail.event) {
                this.showMatchDetailModal(detail.event);
            } else {
                Utils.showToast('未找到比赛详情', 'warning');
            }
        } catch (error) {
            console.error('Get match detail error:', error);
            Utils.showToast('加载详情失败：' + error.message, 'error');
        }
    },

    showMatchDetailModal(event) {
        // 移除已存在的模态框
        const existingModal = document.getElementById('matchDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建弹窗显示比赛详情
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'matchDetailModal';

        const homeTeam = event.homeTeam || {};
        const awayTeam = event.awayTeam || {};
        const homeScore = event.homeScore?.current ?? '-';
        const awayScore = event.awayScore?.current ?? '-';
        const status = event.status || {};
        const tournament = event.tournament || {};

        // 转义所有 API 数据
        const homeName = Utils.escapeHtml(homeTeam.name || '主队');
        const awayName = Utils.escapeHtml(awayTeam.name || '客队');
        const homeCode = Utils.escapeHtml(homeTeam.nameCode || '?');
        const awayCode = Utils.escapeHtml(awayTeam.nameCode || '?');
        const homeShortName = Utils.escapeHtml(homeTeam.shortName || homeTeam.name || '');
        const awayShortName = Utils.escapeHtml(awayTeam.shortName || awayTeam.name || '');
        const tournamentName = Utils.escapeHtml(tournament.name || '');
        const countryName = Utils.escapeHtml(tournament.category?.name || '');
        const statusDesc = Utils.escapeHtml(status.description || '');
        const seasonName = Utils.escapeHtml(event.season?.name || '-');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>比赛详情</h3>
                    <button class="btn-icon modal-close" onclick="document.getElementById('matchDetailModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="match-detail-header">
                        <div class="tournament-info">
                            <span>${countryName}</span>
                            <span>•</span>
                            <span>${tournamentName}</span>
                        </div>
                        <div class="match-detail-teams">
                            <div class="team-detail home">
                                <div class="team-logo">${homeCode}</div>
                                <div class="team-name">${homeName}</div>
                            </div>
                            <div class="match-detail-score">
                                <span class="score">${homeScore}</span>
                                <span class="score-divider">:</span>
                                <span class="score">${awayScore}</span>
                                <div class="match-status">${statusDesc}</div>
                            </div>
                            <div class="team-detail away">
                                <div class="team-logo">${awayCode}</div>
                                <div class="team-name">${awayName}</div>
                            </div>
                        </div>
                    </div>

                    <div class="match-detail-info">
                        <h4>比赛信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="label">比赛ID</span>
                                <span class="value">${event.id || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">状态</span>
                                <span class="value">${status.type || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">开始时间</span>
                                <span class="value">${event.startTimestamp ? new Date(event.startTimestamp * 1000).toLocaleString('zh-CN') : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">赛季</span>
                                <span class="value">${seasonName}</span>
                            </div>
                        </div>
                    </div>

                    <div class="match-detail-actions">
                        <button class="btn btn-primary" onclick="Matches.analyzeMatch('${homeName.replace(/'/g, "\\'")}', '${awayName.replace(/'/g, "\\'")}'); document.getElementById('matchDetailModal').remove();">
                            <i class="fas fa-brain"></i> 智能预测
                        </button>
                        <button class="btn btn-secondary" onclick="Matches.addToRecords('${homeShortName} vs ${awayShortName}'); document.getElementById('matchDetailModal').remove();">
                            <i class="fas fa-plus"></i> 添加记录
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    analyzeMatch(homeTeam, awayTeam) {
        // 跳转到智能预测页面
        App.switchTab('prediction');

        // 设置球队名称
        document.getElementById('homeTeamName').value = homeTeam;
        document.getElementById('awayTeamName').value = awayTeam;

        // 自动从 API 加载数据并计算
        Prediction.autoLoadFromMatch(homeTeam, awayTeam);

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
                        ${result.events.slice(0, 10).map(event => {
                            const homeName = event.homeTeam?.shortName || event.homeTeam?.name || '';
                            const awayName = event.awayTeam?.shortName || event.awayTeam?.name || '';
                            const date = event.startTimestamp
                                ? new Date(event.startTimestamp * 1000).toLocaleDateString('zh-CN')
                                : '';
                            return `
                                <div class="search-result-item" onclick="Matches.selectTeam(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                                    <div class="team-info">
                                        <span class="team-name">${homeName} vs ${awayName}</span>
                                        <span class="team-league">${event.tournament?.name || ''}</span>
                                    </div>
                                    <span class="match-time">${date}</span>
                                </div>
                            `;
                        }).join('')}
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
        const homeName = event.homeTeam?.shortName || event.homeTeam?.name || '';
        const awayName = event.awayTeam?.shortName || event.awayTeam?.name || '';
        const matchName = `${homeName} vs ${awayName}`;

        // 跳转到智能预测页面并自动加载数据
        App.switchTab('prediction');
        document.getElementById('homeTeamName').value = homeName;
        document.getElementById('awayTeamName').value = awayName;

        // 自动从 API 加载数据
        Prediction.autoLoadFromMatch(homeName, awayName);

        Utils.showToast(`已选择：${matchName}，正在加载数据...`, 'success');

        // 清空搜索结果
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    }
};
