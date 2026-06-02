// ===== Kelly Criterion Calculator =====

const Kelly = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('calculateKelly').addEventListener('click', () => this.calculate());
    },

    calculate() {
        const winProb = parseFloat(document.getElementById('kellyWinProb').value);
        const odds = parseFloat(document.getElementById('kellyOdds').value);
        const bankroll = parseFloat(document.getElementById('kellyBankroll').value);
        const fraction = parseFloat(document.getElementById('kellyFraction').value);

        if (!winProb || !odds || !bankroll) {
            Utils.showToast('请填写完整的参数', 'error');
            return;
        }

        if (winProb <= 0 || winProb >= 100) {
            Utils.showToast('胜率必须在 1-99 之间', 'error');
            return;
        }

        if (odds <= 1) {
            Utils.showToast('赔率必须大于 1', 'error');
            return;
        }

        const result = this.calculateKelly(winProb, odds, bankroll, fraction);
        this.displayResult(result);
    },

    calculateKelly(winProb, odds, bankroll, fraction) {
        const p = winProb / 100;
        const q = 1 - p;
        const b = odds - 1;

        // Full Kelly
        const fullKelly = ((b * p - q) / b);

        // Adjusted Kelly
        const adjustedKelly = Math.max(0, fullKelly * fraction);

        // Implied probability
        const impliedProb = 1 / odds;

        // Edge
        const edge = p - impliedProb;

        // Optimal bet size
        const optimalBet = bankroll * adjustedKelly;

        // Expected value
        const ev = (p * (odds - 1) - q) * bankroll * adjustedKelly;

        // Expected growth rate
        const growthRate = p * Math.log(1 + adjustedKelly * b) + q * Math.log(1 - adjustedKelly);

        return {
            winProb,
            odds,
            bankroll,
            fraction,
            fullKelly: fullKelly * 100,
            adjustedKelly: adjustedKelly * 100,
            impliedProb: impliedProb * 100,
            edge: edge * 100,
            optimalBet,
            ev,
            growthRate: growthRate * 100,
            isValue: edge > 0
        };
    },

    displayResult(result) {
        const resultCard = document.getElementById('kellyResult');
        const resultBody = document.getElementById('kellyResultBody');

        resultCard.style.display = 'block';

        const edgeClass = result.edge > 0 ? 'positive' : 'negative';
        const evClass = result.ev > 0 ? 'positive' : 'negative';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">凯利比例</div>
                    <div class="value">${Utils.formatPercent(result.adjustedKelly, 2)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">建议投注</div>
                    <div class="value">${Utils.formatCurrency(result.optimalBet)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">边际优势</div>
                    <div class="value ${edgeClass}">${Utils.formatPercent(result.edge, 2)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">期望收益</div>
                    <div class="value ${evClass}">${Utils.formatCurrency(result.ev)}</div>
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
                            <td>你的胜率</td>
                            <td>${Utils.formatPercent(result.winProb)}</td>
                            <td>你预估的获胜概率</td>
                        </tr>
                        <tr>
                            <td>市场赔率</td>
                            <td>${Utils.formatOdds(result.odds)}</td>
                            <td>十进制赔率</td>
                        </tr>
                        <tr>
                            <td>隐含胜率</td>
                            <td>${Utils.formatPercent(result.impliedProb)}</td>
                            <td>赔率隐含的胜率</td>
                        </tr>
                        <tr>
                            <td>边际优势</td>
                            <td class="${edgeClass}">${Utils.formatPercent(result.edge, 2)}</td>
                            <td>你的胜率 - 隐含胜率</td>
                        </tr>
                        <tr>
                            <td>全额凯利</td>
                            <td>${Utils.formatPercent(result.fullKelly, 2)}</td>
                            <td>理论最优投注比例</td>
                        </tr>
                        <tr>
                            <td>调整后凯利 (${(result.fraction * 100).toFixed(0)}%)</td>
                            <td>${Utils.formatPercent(result.adjustedKelly, 2)}</td>
                            <td>实际使用的投注比例</td>
                        </tr>
                        <tr>
                            <td>建议投注额</td>
                            <td>${Utils.formatCurrency(result.optimalBet)}</td>
                            <td>基于总资金计算</td>
                        </tr>
                        <tr>
                            <td>期望收益 (EV)</td>
                            <td class="${evClass}">${Utils.formatCurrency(result.ev)}</td>
                            <td>单次投注的期望收益</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 16px; padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                <p style="font-size: 13px; color: var(--text-secondary);">
                    ${result.isValue
                        ? '<i class="fas fa-check-circle" style="color: var(--success);"></i> <strong style="color: var(--success);">存在价值投注机会</strong> — 你的胜率高于市场隐含胜率，建议投注。'
                        : '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> <strong style="color: var(--warning);">无价值投注</strong> — 你的胜率低于或等于市场隐含胜率，不建议投注。'
                    }
                </p>
            </div>
        `;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
