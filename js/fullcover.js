// ===== 全包计算模块 =====

const FullCover = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const calculateBtn = document.getElementById('calculateFullCover');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
    },

    calculate() {
        // 获取输入值
        const match = document.getElementById('fullCoverMatch').value.trim() || '全包比赛';
        const type = document.getElementById('fullCoverType').value;
        const odds1 = parseFloat(document.getElementById('fullCoverOdds1').value);
        const oddsX = parseFloat(document.getElementById('fullCoverOddsX').value);
        const odds2 = parseFloat(document.getElementById('fullCoverOdds2').value);
        const totalStake = parseFloat(document.getElementById('fullCoverStake').value);
        const cf = parseFloat(document.getElementById('fullCoverCF').value) || 14;

        // 验证输入
        if (!odds1 || odds1 < 1) {
            Utils.showToast('请输入有效的主胜赔率', 'warning');
            return;
        }
        if (!oddsX || oddsX < 1) {
            Utils.showToast('请输入有效的平局赔率', 'warning');
            return;
        }
        if (!odds2 || odds2 < 1) {
            Utils.showToast('请输入有效的客胜赔率', 'warning');
            return;
        }
        if (!totalStake || totalStake <= 0) {
            Utils.showToast('请输入有效的总投注金额', 'warning');
            return;
        }

        // 计算隐含概率
        const prob1 = 1 / odds1;
        const probX = 1 / oddsX;
        const prob2 = 1 / odds2;
        const totalProb = prob1 + probX + prob2;

        // 计算返还率
        const returnRate = 1 / totalProb;

        // 计算投注分配（套利）
        const stake1 = totalStake * (prob1 / totalProb);
        const stakeX = totalStake * (probX / totalProb);
        const stake2 = totalStake * (prob2 / totalProb);

        // 计算各结果收益
        const win1 = stake1 * odds1;
        const winX = stakeX * oddsX;
        const win2 = stake2 * odds2;

        // 保证收益（取最小值）
        const guaranteedWin = Math.min(win1, winX, win2);
        const commission = totalStake * (cf / 100);
        const netWin = guaranteedWin - totalStake - commission;
        const roi = (netWin / totalStake) * 100;

        // 判断是否存在套利机会
        const isArbitrage = totalProb < 1;

        // 显示结果
        this.displayResult({
            match,
            type,
            odds1,
            oddsX,
            odds2,
            totalStake,
            cf,
            prob1,
            probX,
            prob2,
            totalProb,
            returnRate,
            stake1,
            stakeX,
            stake2,
            win1,
            winX,
            win2,
            guaranteedWin,
            commission,
            netWin,
            roi,
            isArbitrage
        });
    },

    getTypeText(type) {
        const typeMap = {
            'had': '胜平负',
            'ttg': '进球数',
            'crs': '比分'
        };
        return typeMap[type] || type;
    },

    displayResult(result) {
        const resultCard = document.getElementById('fullCoverResult');
        const resultBody = document.getElementById('fullCoverResultBody');
        resultCard.style.display = 'block';

        const profitClass = result.netWin >= 0 ? 'profit' : 'loss';
        const profitIcon = result.netWin >= 0 ? '▲' : '▼';
        const arbitrageClass = result.isArbitrage ? 'profit' : 'loss';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">投注类型</div>
                    <div class="value">${this.getTypeText(result.type)}</div>
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
                <h4>投注分配</h4>
                <table>
                    <tr>
                        <td>主胜</td>
                        <td>赔率: ${Utils.formatOdds(result.odds1)}</td>
                        <td>概率: ${Utils.formatPercent(result.prob1 * 100)}</td>
                        <td>投注: ${Utils.formatCurrency(result.stake1)}</td>
                    </tr>
                    <tr>
                        <td>平局</td>
                        <td>赔率: ${Utils.formatOdds(result.oddsX)}</td>
                        <td>概率: ${Utils.formatPercent(result.probX * 100)}</td>
                        <td>投注: ${Utils.formatCurrency(result.stakeX)}</td>
                    </tr>
                    <tr>
                        <td>客胜</td>
                        <td>赔率: ${Utils.formatOdds(result.odds2)}</td>
                        <td>概率: ${Utils.formatPercent(result.prob2 * 100)}</td>
                        <td>投注: ${Utils.formatCurrency(result.stake2)}</td>
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
                        ? '三个结果的隐含概率之和小于100%，存在套利空间。'
                        : '三个结果的隐含概率之和大于100%，不存在套利空间。建议寻找更高赔率或等待赔率变化。'}
                </p>
            </div>

            <div class="result-details">
                <h4>收益场景</h4>
                <table>
                    <tr>
                        <td>如果主胜</td>
                        <td>收益: ${Utils.formatCurrency(result.win1)}</td>
                        <td>净利润: ${Utils.formatCurrency(result.win1 - result.totalStake - result.commission)}</td>
                    </tr>
                    <tr>
                        <td>如果平局</td>
                        <td>收益: ${Utils.formatCurrency(result.winX)}</td>
                        <td>净利润: ${Utils.formatCurrency(result.winX - result.totalStake - result.commission)}</td>
                    </tr>
                    <tr>
                        <td>如果客胜</td>
                        <td>收益: ${Utils.formatCurrency(result.win2)}</td>
                        <td>净利润: ${Utils.formatCurrency(result.win2 - result.totalStake - result.commission)}</td>
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
                <button class="btn btn-primary" onclick="FullCover.savePlan()">
                    <i class="fas fa-save"></i> 保存方案
                </button>
                <button class="btn btn-secondary" onclick="FullCover.reset()">
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
            type: '全包',
            match: this.lastResult.match,
            stake: this.lastResult.totalStake,
            odds: this.lastResult.returnRate,
            pnl: this.lastResult.netWin,
            details: this.lastResult
        };

        Store.addHedgePlan(plan);
        Utils.showToast('方案已保存', 'success');
    },

    reset() {
        document.getElementById('fullCoverMatch').value = '';
        document.getElementById('fullCoverOdds1').value = '';
        document.getElementById('fullCoverOddsX').value = '';
        document.getElementById('fullCoverOdds2').value = '';
        document.getElementById('fullCoverStake').value = '';
        document.getElementById('fullCoverResult').style.display = 'none';
        this.lastResult = null;
    }
};
