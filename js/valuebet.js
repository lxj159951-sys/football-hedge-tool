// ===== Value Bet Finder =====

const ValueBet = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('calculateValue').addEventListener('click', () => this.calculate());
    },

    calculate() {
        const estProb = parseFloat(document.getElementById('valueEstProb').value);
        const marketOdds = parseFloat(document.getElementById('valueMarketOdds').value);
        const stake = parseFloat(document.getElementById('valueStake').value) || 0;
        const note = document.getElementById('valueNote').value;

        if (!estProb || !marketOdds) {
            Utils.showToast('请填写胜率和赔率', 'error');
            return;
        }

        if (estProb <= 0 || estProb >= 100) {
            Utils.showToast('胜率必须在 1-99 之间', 'error');
            return;
        }

        if (marketOdds <= 1) {
            Utils.showToast('赔率必须大于 1', 'error');
            return;
        }

        const result = this.analyzeValue(estProb, marketOdds, stake, note);
        this.displayResult(result);
    },

    analyzeValue(estProb, marketOdds, stake, note) {
        const p = estProb / 100;
        const impliedProb = 1 / marketOdds;
        const edge = p - impliedProb;
        const isValue = edge > 0;

        // Expected value
        const ev = stake > 0 ? (p * (marketOdds - 1) - (1 - p)) * stake : 0;
        const evPercent = (p * marketOdds - 1) * 100;

        // Kelly criterion for optimal bet
        const kellyFraction = Utils.kellyCriterion(estProb, marketOdds, 0.5);

        // Potential profit
        const potentialProfit = stake > 0 ? stake * (marketOdds - 1) : 0;

        // Break-even probability
        const breakEvenProb = (1 / marketOdds) * 100;

        return {
            estProb,
            marketOdds,
            impliedProb: impliedProb * 100,
            edge: edge * 100,
            isValue,
            ev,
            evPercent,
            kellyFraction: kellyFraction * 100,
            stake,
            potentialProfit,
            breakEvenProb,
            note
        };
    },

    displayResult(result) {
        const resultCard = document.getElementById('valueResult');
        const resultBody = document.getElementById('valueResultBody');

        resultCard.style.display = 'block';

        const edgeClass = result.edge > 0 ? 'positive' : 'negative';
        const evClass = result.evPercent > 0 ? 'positive' : 'negative';

        resultBody.innerHTML = `
            <div style="text-align: center; padding: 20px; margin-bottom: 20px;">
                ${result.isValue
                    ? `<div style="font-size: 48px; margin-bottom: 8px;">💎</div>
                       <h3 style="color: var(--success); font-size: 24px;">发现价值投注！</h3>
                       <p style="color: var(--text-secondary);">这是一个值得投注的机会</p>`
                    : `<div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
                       <h3 style="color: var(--warning); font-size: 24px;">无价值投注</h3>
                       <p style="color: var(--text-secondary);">当前赔率不具有投注价值</p>`
                }
            </div>

            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">你的胜率</div>
                    <div class="value">${Utils.formatPercent(result.estProb)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">市场隐含胜率</div>
                    <div class="value">${Utils.formatPercent(result.impliedProb)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">边际优势</div>
                    <div class="value ${edgeClass}">${Utils.formatPercent(result.edge)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">期望收益率</div>
                    <div class="value ${evClass}">${Utils.formatPercent(result.evPercent)}</div>
                </div>
            </div>

            <div class="result-details">
                <h4 style="margin-bottom: 12px;">详细分析</h4>
                <table>
                    <thead>
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>你的预估胜率</td>
                            <td>${Utils.formatPercent(result.estProb)}</td>
                            <td>你认为的获胜概率</td>
                        </tr>
                        <tr>
                            <td>市场赔率</td>
                            <td>${Utils.formatOdds(result.marketOdds)}</td>
                            <td>十进制赔率</td>
                        </tr>
                        <tr>
                            <td>隐含胜率</td>
                            <td>${Utils.formatPercent(result.impliedProb)}</td>
                            <td>赔率隐含的胜率 (1/赔率)</td>
                        </tr>
                        <tr>
                            <td>盈亏平衡点</td>
                            <td>${Utils.formatPercent(result.breakEvenProb)}</td>
                            <td>需要达到此胜率才能不亏</td>
                        </tr>
                        <tr>
                            <td>边际优势</td>
                            <td class="${edgeClass}">${Utils.formatPercent(result.edge)}</td>
                            <td>你的胜率 - 隐含胜率</td>
                        </tr>
                        <tr>
                            <td>期望收益率</td>
                            <td class="${evClass}">${Utils.formatPercent(result.evPercent)}</td>
                            <td>每 1 元投注的期望收益</td>
                        </tr>
                        <tr>
                            <td>半凯利建议</td>
                            <td>${Utils.formatPercent(result.kellyFraction)}</td>
                            <td>建议投注占资金的比例</td>
                        </tr>
                        ${result.stake > 0 ? `
                        <tr>
                            <td>投注金额</td>
                            <td>${Utils.formatCurrency(result.stake)}</td>
                            <td>本次投注金额</td>
                        </tr>
                        <tr>
                            <td>期望收益</td>
                            <td class="${evClass}">${Utils.formatCurrency(result.ev)}</td>
                            <td>本次投注的期望收益</td>
                        </tr>
                        <tr>
                            <td>潜在利润</td>
                            <td class="positive">${Utils.formatCurrency(result.potentialProfit)}</td>
                            <td>如果赢了能赚多少</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>

            ${result.note ? `
            <div style="margin-top: 16px; padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                <p style="font-size: 13px; color: var(--text-secondary);">
                    <i class="fas fa-sticky-note"></i> <strong>备注：</strong>${result.note}
                </p>
            </div>
            ` : ''}

            ${result.isValue && result.stake > 0 ? `
            <div style="margin-top: 16px;">
                <button class="btn btn-primary btn-block" onclick="ValueBet.saveAsRecord(${JSON.stringify(result).replace(/"/g, '&quot;')})">
                    <i class="fas fa-save"></i> 保存为投注记录
                </button>
            </div>
            ` : ''}
        `;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    saveAsRecord(result) {
        const record = {
            match: result.note || '价值投注',
            type: '价值投注',
            selection: '-',
            odds: result.marketOdds,
            stake: result.stake,
            result: 'pending',
            pnl: 0,
            date: new Date().toISOString().split('T')[0],
            note: `预估胜率: ${result.estProb}%, 边际: ${Utils.formatPercent(result.edge)}`
        };

        Store.addRecord(record);
        Utils.showToast('已保存到投注记录', 'success');

        // 刷新投注记录和仪表盘
        Records.loadRecords();
        App.updateDashboard();
    }
};
