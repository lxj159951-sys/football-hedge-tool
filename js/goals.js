// ===== 进球数计算模块 =====

const Goals = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const calculateBtn = document.getElementById('calculateGoals');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
    },

    calculate() {
        // 获取输入值
        const match = document.getElementById('goalsMatch').value.trim() || '进球数比赛';
        const line = parseFloat(document.getElementById('goalsLine').value);
        const overOdds = parseFloat(document.getElementById('goalsOverOdds').value);
        const underOdds = parseFloat(document.getElementById('goalsUnderOdds').value);
        const stake = parseFloat(document.getElementById('goalsStake').value);
        const cf = parseFloat(document.getElementById('goalsCF').value) || 12;

        // 验证输入
        if (!overOdds || overOdds < 1) {
            Utils.showToast('请输入有效的大球赔率', 'warning');
            return;
        }
        if (!underOdds || underOdds < 1) {
            Utils.showToast('请输入有效的小球赔率', 'warning');
            return;
        }
        if (!stake || stake <= 0) {
            Utils.showToast('请输入有效的投注金额', 'warning');
            return;
        }

        // 计算隐含概率
        const overProb = 1 / overOdds;
        const underProb = 1 / underOdds;
        const totalProb = overProb + underProb;

        // 计算返还率
        const returnRate = 1 / totalProb;

        // 计算投注分配（套利）
        const overStake = stake * (underProb / totalProb);
        const underStake = stake * (overProb / totalProb);

        // 计算收益
        const overWin = overStake * overOdds;
        const underWin = underStake * underOdds;
        const guaranteedWin = Math.min(overWin, underWin);
        const commission = stake * (cf / 100);
        const netWin = guaranteedWin - stake - commission;
        const roi = (netWin / stake) * 100;

        // 判断是否存在套利机会
        const isArbitrage = totalProb < 1;

        // 显示结果
        this.displayResult({
            match,
            line,
            overOdds,
            underOdds,
            stake,
            cf,
            overProb,
            underProb,
            totalProb,
            returnRate,
            overStake,
            underStake,
            overWin,
            underWin,
            guaranteedWin,
            commission,
            netWin,
            roi,
            isArbitrage
        });
    },

    displayResult(result) {
        const resultCard = document.getElementById('goalsResult');
        const resultBody = document.getElementById('goalsResultBody');
        resultCard.style.display = 'block';

        const profitClass = result.netWin >= 0 ? 'profit' : 'loss';
        const profitIcon = result.netWin >= 0 ? '▲' : '▼';
        const arbitrageClass = result.isArbitrage ? 'profit' : 'loss';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">盘口</div>
                    <div class="value">${result.line}球</div>
                </div>
                <div class="summary-item">
                    <div class="label">返还率</div>
                    <div class="value">${Utils.formatPercent(result.returnRate * 100)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">保证收益</div>
                    <div class="value ${profitClass}">${Utils.formatCurrency(result.guaranteedWin)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">净利润</div>
                    <div class="value ${profitClass}">${profitIcon} ${Utils.formatCurrency(result.netWin)}</div>
                </div>
            </div>

            <div class="result-details">
                <h4>赔率分析</h4>
                <table>
                    <tr>
                        <td>大球 (${result.line})</td>
                        <td>赔率: ${Utils.formatOdds(result.overOdds)}</td>
                        <td>概率: ${Utils.formatPercent(result.overProb * 100)}</td>
                        <td>投注: ${Utils.formatCurrency(result.overStake)}</td>
                    </tr>
                    <tr>
                        <td>小球 (${result.line})</td>
                        <td>赔率: ${Utils.formatOdds(result.underOdds)}</td>
                        <td>概率: ${Utils.formatPercent(result.underProb * 100)}</td>
                        <td>投注: ${Utils.formatCurrency(result.underStake)}</td>
                    </tr>
                    <tr>
                        <td>合计</td>
                        <td colspan="2">隐含概率: ${Utils.formatPercent(result.totalProb * 100)}</td>
                        <td>返点: ${result.cf}%</td>
                    </tr>
                </table>
            </div>

            <div class="result-details">
                <h4>套利机会</h4>
                <div class="value-indicator ${arbitrageClass}">
                    <i class="fas ${result.isArbitrage ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    <span>${result.isArbitrage ? '存在套利机会！' : '不存在套利机会'}</span>
                </div>
                <p class="value-desc">
                    ${result.isArbitrage
                        ? '大球和小球的隐含概率之和小于100%，存在套利空间。'
                        : '大球和小球的隐含概率之和大于100%，不存在套利空间。建议寻找更高赔率或等待赔率变化。'}
                </p>
            </div>

            <div class="result-details">
                <h4>收益场景</h4>
                <table>
                    <tr>
                        <td>如果大球</td>
                        <td>收益: ${Utils.formatCurrency(result.overWin)}</td>
                        <td>净利润: ${Utils.formatCurrency(result.overWin - result.stake - result.commission)}</td>
                    </tr>
                    <tr>
                        <td>如果小球</td>
                        <td>收益: ${Utils.formatCurrency(result.underWin)}</td>
                        <td>净利润: ${Utils.formatCurrency(result.underWin - result.stake - result.commission)}</td>
                    </tr>
                    <tr>
                        <td>保证收益</td>
                        <td colspan="2" class="${profitClass}">
                            ${Utils.formatCurrency(result.guaranteedWin)} (扣除手续费后: ${Utils.formatCurrency(result.netWin)})
                        </td>
                    </tr>
                </table>
            </div>

            <div class="result-actions">
                <button class="btn btn-primary" onclick="Goals.savePlan()">
                    <i class="fas fa-save"></i> 保存方案
                </button>
                <button class="btn btn-secondary" onclick="Goals.reset()">
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
            type: '进球数',
            match: this.lastResult.match,
            stake: this.lastResult.stake,
            odds: this.lastResult.line,
            pnl: this.lastResult.netWin,
            details: this.lastResult
        };

        Store.addHedgePlan(plan);
        Utils.showToast('方案已保存', 'success');
    },

    reset() {
        document.getElementById('goalsMatch').value = '';
        document.getElementById('goalsOverOdds').value = '';
        document.getElementById('goalsUnderOdds').value = '';
        document.getElementById('goalsStake').value = '';
        document.getElementById('goalsResult').style.display = 'none';
        this.lastResult = null;
    }
};
