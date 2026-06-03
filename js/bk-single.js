// ===== 篮球单关计算模块 =====

const BkSingle = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const calculateBtn = document.getElementById('calculateBkSingle');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
    },

    calculate() {
        // 获取输入值
        const match = document.getElementById('bkSingleMatch').value.trim() || '篮球单关';
        const odds = parseFloat(document.getElementById('bkSingleOdds').value);
        const stake = parseFloat(document.getElementById('bkSingleStake').value);
        const cf = parseFloat(document.getElementById('bkSingleCF').value) || 25;

        // 验证输入
        if (!odds || odds < 1) {
            Utils.showToast('请输入有效的赔率', 'warning');
            return;
        }
        if (!stake || stake <= 0) {
            Utils.showToast('请输入有效的投注金额', 'warning');
            return;
        }

        // 计算
        const potentialWin = stake * odds;
        const commission = stake * (cf / 100);
        const netWin = potentialWin - stake - commission;
        const roi = (netWin / stake) * 100;

        // 隐含概率
        const impliedProb = 1 / odds;
        const fairOdds = 1 / impliedProb;

        // 对冲计算
        const hedgeOdds = odds * 0.9;
        const hedgeStake = (stake * odds) / hedgeOdds;
        const guaranteedProfit = (stake * odds) - stake - hedgeStake - commission;

        // 价值投注判断
        const isValue = roi > 0;

        // 显示结果
        this.displayResult({
            match,
            odds,
            stake,
            cf,
            potentialWin,
            commission,
            netWin,
            roi,
            impliedProb,
            fairOdds,
            hedgeOdds,
            hedgeStake,
            guaranteedProfit,
            isValue
        });
    },

    displayResult(result) {
        const resultCard = document.getElementById('bkSingleResult');
        const resultBody = document.getElementById('bkSingleResultBody');
        resultCard.style.display = 'block';

        const profitClass = result.netWin >= 0 ? 'profit' : 'loss';
        const profitIcon = result.netWin >= 0 ? '▲' : '▼';
        const valueClass = result.isValue ? 'profit' : 'loss';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">投注赔率</div>
                    <div class="value">${Utils.formatOdds(result.odds)}</div>
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
                <h4>详细分析</h4>
                <table>
                    <tr>
                        <td>比赛</td>
                        <td colspan="3">${Utils.escapeHtml(result.match)}</td>
                    </tr>
                    <tr>
                        <td>投注金额</td>
                        <td>${Utils.formatCurrency(result.stake)}</td>
                        <td>返点</td>
                        <td>${result.cf}%</td>
                    </tr>
                    <tr>
                        <td>隐含概率</td>
                        <td>${Utils.formatPercent(result.impliedProb * 100)}</td>
                        <td>公平赔率</td>
                        <td>${Utils.formatOdds(result.fairOdds)}</td>
                    </tr>
                    <tr>
                        <td>手续费</td>
                        <td colspan="3">${Utils.formatCurrency(result.commission)}</td>
                    </tr>
                </table>
            </div>

            <div class="result-details">
                <h4>价值判断</h4>
                <div class="value-indicator ${valueClass}">
                    <i class="fas ${result.isValue ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    <span>${result.isValue ? '存在价值投注机会' : '不存在价值投注机会'}</span>
                </div>
                <p class="value-desc">
                    ${result.isValue
                        ? '当前赔率高于隐含概率，存在正期望值。'
                        : '当前赔率低于隐含概率，建议谨慎投注。'}
                </p>
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
                <button class="btn btn-primary" onclick="BkSingle.savePlan()">
                    <i class="fas fa-save"></i> 保存方案
                </button>
                <button class="btn btn-secondary" onclick="BkSingle.reset()">
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
            type: '篮球单关',
            match: this.lastResult.match,
            stake: this.lastResult.stake,
            odds: this.lastResult.odds,
            pnl: this.lastResult.netWin,
            details: this.lastResult
        };

        Store.addHedgePlan(plan);
        Utils.showToast('方案已保存', 'success');
    },

    reset() {
        document.getElementById('bkSingleMatch').value = '';
        document.getElementById('bkSingleOdds').value = '';
        document.getElementById('bkSingleStake').value = '';
        document.getElementById('bkSingleResult').style.display = 'none';
        this.lastResult = null;
    }
};
