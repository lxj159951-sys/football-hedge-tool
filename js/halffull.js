// ===== 半全场计算模块 =====

const HalfFull = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const calculateBtn = document.getElementById('calculateHalfFull');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
    },

    calculate() {
        // 获取输入值
        const match = document.getElementById('halfFullMatch').value.trim() || '半全场比赛';
        const selection = document.getElementById('halfFullSelection').value;
        const odds = parseFloat(document.getElementById('halfFullOdds').value);
        const stake = parseFloat(document.getElementById('halfFullStake').value);

        // 验证输入
        if (!odds || odds < 1) {
            Utils.showToast('请输入有效的赔率', 'warning');
            return;
        }
        if (!stake || stake <= 0) {
            Utils.showToast('请输入有效的投注金额', 'warning');
            return;
        }

        // 解析选择
        const [half, full] = selection.split('-');
        const selectionText = this.getSelectionText(half, full);

        // 计算
        const potentialWin = stake * odds;
        const netWin = potentialWin - stake;
        const roi = (netWin / stake) * 100;

        // 隐含概率
        const impliedProb = 1 / odds;

        // 半全场各选项的典型赔率范围
        const typicalOdds = {
            '1-1': 3.5, '1-X': 15, '1-2': 30,
            'X-1': 7, 'X-X': 6, 'X-2': 12,
            '2-1': 25, '2-X': 15, '2-2': 4
        };

        // 对冲计算
        const hedgeOdds = odds * 0.85;
        const hedgeStake = (stake * odds) / hedgeOdds;
        const guaranteedProfit = (stake * odds) - stake - hedgeStake;

        // 显示结果
        this.displayResult({
            match,
            selection,
            selectionText,
            half,
            full,
            odds,
            stake,
            potentialWin,
            netWin,
            roi,
            impliedProb,
            typicalOdds: typicalOdds[selection] || odds,
            hedgeOdds,
            hedgeStake,
            guaranteedProfit
        });
    },

    getSelectionText(half, full) {
        const halfText = { '1': '主胜', 'X': '平局', '2': '客胜' };
        const fullText = { '1': '主胜', 'X': '平局', '2': '客胜' };
        return `${halfText[half]}/${fullText[full]}`;
    },

    displayResult(result) {
        const resultCard = document.getElementById('halfFullResult');
        const resultBody = document.getElementById('halfFullResultBody');
        resultCard.style.display = 'block';

        const profitClass = result.netWin >= 0 ? 'profit' : 'loss';
        const profitIcon = result.netWin >= 0 ? '▲' : '▼';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">投注选项</div>
                    <div class="value">${result.selectionText}</div>
                </div>
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
            </div>

            <div class="result-details">
                <h4>详细分析</h4>
                <table>
                    <tr>
                        <td>比赛</td>
                        <td colspan="3">${Utils.escapeHtml(result.match)}</td>
                    </tr>
                    <tr>
                        <td>半场/全场</td>
                        <td>${result.selectionText}</td>
                        <td>隐含概率</td>
                        <td>${Utils.formatPercent(result.impliedProb * 100)}</td>
                    </tr>
                    <tr>
                        <td>投注金额</td>
                        <td>${Utils.formatCurrency(result.stake)}</td>
                        <td>收益率</td>
                        <td class="${profitClass}">${Utils.formatPercent(result.roi)}</td>
                    </tr>
                    <tr>
                        <td>同类典型赔率</td>
                        <td colspan="3">${Utils.formatOdds(result.typicalOdds)}</td>
                    </tr>
                </table>
            </div>

            <div class="result-details">
                <h4>风险评估</h4>
                <div class="risk-indicator">
                    <div class="risk-bar">
                        <div class="risk-fill" style="width: ${Math.min(100, result.impliedProb * 100)}%"></div>
                    </div>
                    <span class="risk-label">中奖概率: ${Utils.formatPercent(result.impliedProb * 100)}</span>
                </div>
                <p class="value-desc">
                    半全场是高赔率投注方式，中奖难度较大但回报丰厚。建议：
                    ${result.impliedProb > 0.15
                        ? '当前选项概率相对较高，可以适当投注。'
                        : '当前选项概率较低，建议小金额投注或作为串关的一部分。'}
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
                <button class="btn btn-primary" onclick="HalfFull.savePlan()">
                    <i class="fas fa-save"></i> 保存方案
                </button>
                <button class="btn btn-secondary" onclick="HalfFull.reset()">
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
            type: '半全场',
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
        document.getElementById('halfFullMatch').value = '';
        document.getElementById('halfFullOdds').value = '';
        document.getElementById('halfFullStake').value = '';
        document.getElementById('halfFullResult').style.display = 'none';
        this.lastResult = null;
    }
};
