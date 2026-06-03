// ===== 历史方案管理模块 =====

const HedgeHistory = {
    plans: [],
    filter: 'all',

    init() {
        this.loadPlans();
        this.bindEvents();
        this.renderPlans();
    },

    loadPlans() {
        this.plans = Store.getHedgePlans();
    },

    bindEvents() {
        // 筛选
        const filterSelect = document.getElementById('plansFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filter = e.target.value;
                this.renderPlans();
            });
        }

        // 清空所有
        const clearBtn = document.getElementById('clearAllPlans');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
    },

    getFilteredPlans() {
        if (this.filter === 'all') {
            return this.plans;
        }
        return this.plans.filter(p => p.type === this.filter);
    },

    renderPlans() {
        const container = document.getElementById('hedgePlansList');
        if (!container) return;

        const filteredPlans = this.getFilteredPlans();

        if (filteredPlans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无历史方案</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredPlans.map(plan => `
            <div class="plan-card" data-id="${plan.id}">
                <div class="plan-header">
                    <span class="plan-type">${Utils.escapeHtml(plan.type)}</span>
                    <span class="plan-date">${Utils.formatDateTime(plan.createdAt)}</span>
                </div>
                <div class="plan-body">
                    <div class="plan-match">${Utils.escapeHtml(plan.match)}</div>
                    <div class="plan-details">
                        <span>投注: ${Utils.formatCurrency(plan.stake)}</span>
                        <span>赔率: ${Utils.formatOdds(plan.odds)}</span>
                        <span class="${plan.pnl >= 0 ? 'profit' : 'loss'}">
                            预期盈亏: ${Utils.formatCurrency(plan.pnl)}
                        </span>
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="btn btn-sm btn-secondary" onclick="HedgeHistory.loadPlan('${plan.id}')">
                        <i class="fas fa-redo"></i> 重新计算
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="HedgeHistory.deletePlan('${plan.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
    },

    loadPlan(id) {
        const plan = this.plans.find(p => p.id === id);
        if (!plan) {
            Utils.showToast('方案不存在', 'error');
            return;
        }

        // 根据方案类型跳转到对应的计算页面
        const typeMap = {
            '2串1': 'twoOneCalc',
            '单关': 'singleCalc',
            '进球数': 'goalsCalc',
            '半全场': 'halfFullCalc',
            '全包': 'fullCoverCalc',
            '篮球串关': 'bkTwoOne',
            '篮球单关': 'bkSingle'
        };

        const tabId = typeMap[plan.type];
        if (tabId) {
            // 切换到对应的 Tab
            App.switchTab(tabId);

            // 填充表单数据
            this.fillForm(plan);
            Utils.showToast('方案已加载', 'success');
        }
    },

    fillForm(plan) {
        // 根据方案类型填充不同的表单
        switch (plan.type) {
            case '2串1':
                if (plan.details) {
                    document.getElementById('twoOneTeam1').value = plan.details.team1 || '';
                    document.getElementById('twoOneTeam2').value = plan.details.team2 || '';
                    document.getElementById('twoOneOdds1').value = plan.details.odds1 || '';
                    document.getElementById('twoOneOdds2').value = plan.details.odds2 || '';
                    document.getElementById('twoOneStake').value = plan.stake || '';
                }
                break;
            case '单关':
                document.getElementById('singleMatch').value = plan.match || '';
                document.getElementById('singleOdds').value = plan.odds || '';
                document.getElementById('singleStake').value = plan.stake || '';
                break;
            case '进球数':
                document.getElementById('goalsMatch').value = plan.match || '';
                document.getElementById('goalsStake').value = plan.stake || '';
                if (plan.details) {
                    document.getElementById('goalsOverOdds').value = plan.details.overOdds || '';
                    document.getElementById('goalsUnderOdds').value = plan.details.underOdds || '';
                }
                break;
            case '半全场':
                document.getElementById('halfFullMatch').value = plan.match || '';
                document.getElementById('halfFullOdds').value = plan.odds || '';
                document.getElementById('halfFullStake').value = plan.stake || '';
                break;
            case '全包':
                document.getElementById('fullCoverMatch').value = plan.match || '';
                document.getElementById('fullCoverStake').value = plan.stake || '';
                if (plan.details) {
                    document.getElementById('fullCoverOdds1').value = plan.details.odds1 || '';
                    document.getElementById('fullCoverOddsX').value = plan.details.oddsX || '';
                    document.getElementById('fullCoverOdds2').value = plan.details.odds2 || '';
                }
                break;
            case '篮球串关':
                if (plan.details) {
                    document.getElementById('bkTwoOneTeam1').value = plan.details.team1 || '';
                    document.getElementById('bkTwoOneTeam2').value = plan.details.team2 || '';
                    document.getElementById('bkTwoOneOdds1').value = plan.details.odds1 || '';
                    document.getElementById('bkTwoOneOdds2').value = plan.details.odds2 || '';
                    document.getElementById('bkTwoOneStake').value = plan.stake || '';
                }
                break;
            case '篮球单关':
                document.getElementById('bkSingleMatch').value = plan.match || '';
                document.getElementById('bkSingleOdds').value = plan.odds || '';
                document.getElementById('bkSingleStake').value = plan.stake || '';
                break;
        }
    },

    deletePlan(id) {
        if (!confirm('确定要删除这个方案吗？')) {
            return;
        }

        Store.deleteHedgePlan(id);
        this.plans = this.plans.filter(p => p.id !== id);
        this.renderPlans();
        Utils.showToast('方案已删除', 'success');
    },

    clearAll() {
        if (!confirm('确定要清空所有历史方案吗？此操作不可恢复！')) {
            return;
        }

        Store.set(Store.KEYS.HEDGE_PLANS, []);
        this.plans = [];
        this.renderPlans();
        Utils.showToast('所有方案已清空', 'success');
    }
};
