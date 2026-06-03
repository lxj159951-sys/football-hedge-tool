// ===== 篮球串关计算模块 =====

const BkTwoOne = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const calculateBtn = document.getElementById('calculateBkTwoOne');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
    },

    calculate() {
        // 获取输入值
        const team1 = document.getElementById('bkTwoOneTeam1').value.trim() || '比赛1';
        const team2 = document.getElementById('bkTwoOneTeam2').value.trim() || '比赛2';
        const odds1 = parseFloat(document.getElementById('bkTwoOneOdds1').value);
        const odds2 = parseFloat(document.getElementById('bkTwoOneOdds2').value);
        const stake = parseFloat(document.getElementById('bkTwoOneStake').value);
        const cf = parseFloat(document.getElementById('bkTwoOneCF').value) || 26;

        // 验证输入
        if (!odds1 || odds1 < 1) {
            Utils.showToast('请输入有效的比赛1赔率', 'warning');
            return;
        }
        if (!odds2 || odds2 < 1) {
            Utils.showToast('请输入有效的比赛2赔率', 'warning');
            return;
        }
        if (!stake || stake <= 0) {
            Utils.showToast('请输入有效的投注金额', 'warning');
            return;
        }

        // 计算
        const combinedOdds = odds1 * odds2;
        const potentialWin = stake * combinedOdds;
        const commission = stake * (cf / 100);
        const netWin = potentialWin - stake - commission;
        const roi = (netWin / stake) * 100;

        // 隐含概率
        const prob1 = 1 / odds1;
        const prob2 = 1 / odds2;
        const combinedProb = prob1 * prob2;

        // 对冲建议
        const hedgeOdds = 1 / (1 - combinedProb);
        const hedgeStake = (stake * combinedOdds) / hedgeOdds;
        const guaranteedProfit = (stake * combinedOdds) - stake - hedgeStake - commission;

        // 显示结果
        this.displayResult({
            team1,
            team2,
            odds1,
            odds2,
            stake,
            cf,
            combinedOdds,
            potentialWin,
            commission,
            netWin,
            roi,
            prob1,
            prob2,
            combinedProb,
            hedgeOdds,
            hedgeStake,
            guaranteedProfit
        });
    },

    displayResult(result) {
        const resultCard = document.getElementById('bkTwoOneResult');
        const resultBody = document.getElementById('bkTwoOneResultBody');
        resultCard.style.display = 'block';

        const profitClass = result.netWin >= 0 ? 'profit' : 'loss';
        const profitIcon = result.netWin >= 0 ? '▲' : '▼';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">组合赔率</div>
                    <div class="value">${Utils.formatOdds(result.combinedOdds)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">潜在收益</div>
                    <div class="value ${profitClass}">${Utils.formatCurrency(result.potentialWin)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">净利润</div>
                    <div class="value ${profitClass}">${profitIcon} ${Utils.formatCurrency(result.netWin)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">收益率</div>
                    <div class="value ${profitClass}">${Utils.formatPercent(result.roi)}</div>
                </div>
            </div>

            <div class="result-details">
                <h4>详细计算</h4>
                <table>
                    <tr>
                        <td>比赛1</td>
                        <td>${Utils.escapeHtml(result.team1)}</td>
                        <td>赔率: ${Utils.formatOdds(result.odds1)}</td>
                        <td>概率: ${Utils.formatPercent(result.prob1 * 100)}</td>
                    </tr>
                    <tr>
                        <td>比赛2</td>
                        <td>${Utils.escapeHtml(result.team2)}</td>
                        <td>赔率: ${Utils.formatOdds(result.odds2)}</td>
                        <td>概率: ${Utils.formatPercent(result.prob2 * 100)}</td>
                    </tr>
                    <tr>
                        <td>组合</td>
                        <td colspan="2">隐含概率: ${Utils.formatPercent(result.combinedProb * 100)}</td>
                        <td>返点: ${result.cf}%</td>
                    </tr>
                </table>
            </div>

            <div class="result-details">
                <h4>对冲建议</h4>
                <table>
                    <tr>
                        <td>对冲赔率</td>
                        <td colspan="3">${Utils.formatOdds(result.hedgeOdds)}</td>
                    </tr>
                    <tr>
                        <td>对冲金额</td>
                        <td colspan="3">${Utils.formatCurrency(result.hedgeStake)}</td>
                    </tr>
                    <tr>
                        <td>保底收益</td>
                        <td colspan="3" class="${result.guaranteedProfit >= 0 ? 'profit' : 'loss'}">
                            ${Utils.formatCurrency(result.guaranteedProfit)}
                        </td>
                    </tr>
                </table>
            </div>

            <div class="result-actions">
                <button class="btn btn-primary" onclick="BkTwoOne.savePlan()">
                    <i class="fas fa-save"></i> 保存方案
                </button>
                <button class="btn btn-secondary" onclick="BkTwoOne.reset()">
                    <i class="fas fa-redo"></i> 重新计算
                </button>
            </div>
        `;

        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 保存当前计算结果
        this.lastResult = result;
    },

    savePlan() {
        if (!this.lastResult) {
            Utils.showToast('没有可保存的方案', 'warning');
            return;
        }

        const plan = {
            type: '篮球串关',
            match: `${this.lastResult.team1} vs ${this.lastResult.team2}`,
            stake: this.lastResult.stake,
            odds: this.lastResult.combinedOdds,
            pnl: this.lastResult.netWin,
            details: this.lastResult
        };

        Store.addHedgePlan(plan);
        Utils.showToast('方案已保存', 'success');
    },

    reset() {
        document.getElementById('bkTwoOneTeam1').value = '';
        document.getElementById('bkTwoOneTeam2').value = '';
        document.getElementById('bkTwoOneOdds1').value = '';
        document.getElementById('bkTwoOneOdds2').value = '';
        document.getElementById('bkTwoOneStake').value = '';
        document.getElementById('bkTwoOneResult').style.display = 'none';
        this.lastResult = null;
    }
};
