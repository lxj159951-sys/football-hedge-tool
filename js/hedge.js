// ===== Hedge Calculator =====

const Hedge = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Calculate hedge
        document.getElementById('calculateHedge').addEventListener('click', () => this.calculate());

        // Update selection options based on type
        document.getElementById('hedgeType').addEventListener('change', (e) => {
            this.updateSelectionOptions(e.target.value);
        });
    },

    updateSelectionOptions(type) {
        const select = document.getElementById('hedgeSelection');
        const options = {
            'win': [
                { value: 'home', label: '主胜' },
                { value: 'draw', label: '平局' },
                { value: 'away', label: '客胜' }
            ],
            'overunder': [
                { value: 'over', label: '大球' },
                { value: 'under', label: '小球' }
            ],
            'handicap': [
                { value: 'home', label: '主队让球' },
                { value: 'away', label: '客队让球' }
            ]
        };

        select.innerHTML = (options[type] || options['win']).map(o =>
            `<option value="${o.value}">${o.label}</option>`
        ).join('');
    },

    calculate() {
        const type = document.getElementById('hedgeType').value;
        const selection = document.getElementById('hedgeSelection').value;
        const originalOdds = parseFloat(document.getElementById('hedgeOriginalOdds').value);
        const originalStake = parseFloat(document.getElementById('hedgeOriginalStake').value);
        const counterOdds = parseFloat(document.getElementById('hedgeCounterOdds').value);
        const strategy = document.querySelector('input[name="hedgeStrategy"]:checked').value;

        if (!originalOdds || !originalStake || !counterOdds) {
            Utils.showToast('请填写完整的投注信息', 'error');
            return;
        }

        if (originalOdds <= 1 || counterOdds <= 1) {
            Utils.showToast('赔率必须大于 1', 'error');
            return;
        }

        const result = this.calculateHedge(originalOdds, originalStake, counterOdds, strategy);
        this.displayResult(result, type, selection);
    },

    calculateHedge(originalOdds, originalStake, counterOdds, strategy) {
        const originalPotentialWin = originalStake * (originalOdds - 1);

        // Different strategies
        let hedgeStake, guaranteedProfit, maxProfit, minProfit;

        switch (strategy) {
            case 'guaranteed':
                // 保底型：确保两边利润相等，不亏损
                // 原始赢：利润 = originalStake * (originalOdds - 1) - hedgeStake
                // 对冲赢：利润 = hedgeStake * (counterOdds - 1) - originalStake
                // 两边相等，求解 hedgeStake
                hedgeStake = (originalStake * originalOdds) / counterOdds;
                hedgeStake = Math.round(hedgeStake * 100) / 100;
                // 两边利润相等
                const profitIfOriginalWins = originalPotentialWin - hedgeStake;
                const profitIfHedgeWins = hedgeStake * (counterOdds - 1) - originalStake;
                guaranteedProfit = Math.min(profitIfOriginalWins, profitIfHedgeWins);
                maxProfit = Math.max(profitIfOriginalWins, profitIfHedgeWins);
                minProfit = guaranteedProfit;
                break;

            case 'balanced':
                // 平衡型：对冲较少，原始赢时利润更高，但对冲赢时利润较低
                // 对冲金额 = 原始投注的 70%（可调整）
                hedgeStake = Math.round((originalStake * 0.7) * 100) / 100;
                const balancedProfitIfOriginal = originalPotentialWin - hedgeStake;
                const balancedProfitIfHedge = hedgeStake * (counterOdds - 1) - originalStake;
                guaranteedProfit = Math.min(balancedProfitIfOriginal, balancedProfitIfHedge);
                maxProfit = Math.max(balancedProfitIfOriginal, balancedProfitIfHedge);
                minProfit = guaranteedProfit;
                break;

            case 'aggressive':
                // 激进型：只对冲一小部分，追求高利润
                // 对冲金额 = 原始投注的 30%（可调整）
                hedgeStake = Math.round((originalStake * 0.3) * 100) / 100;
                const aggressiveProfitIfOriginal = originalPotentialWin - hedgeStake;
                const aggressiveProfitIfHedge = hedgeStake * (counterOdds - 1) - originalStake;
                guaranteedProfit = Math.min(aggressiveProfitIfOriginal, aggressiveProfitIfHedge);
                maxProfit = aggressiveProfitIfOriginal; // 原始赢时利润最高
                minProfit = guaranteedProfit;
                break;

            default:
                hedgeStake = 0;
                guaranteedProfit = 0;
                maxProfit = 0;
                minProfit = 0;
        }

        const totalInvestment = originalStake + hedgeStake;
        const roi = (guaranteedProfit / totalInvestment) * 100;

        return {
            originalOdds,
            originalStake,
            counterOdds,
            hedgeStake,
            strategy,
            totalInvestment,
            guaranteedProfit,
            maxProfit,
            minProfit,
            roi,
            originalPotentialWin,
            hedgePotentialWin: hedgeStake * (counterOdds - 1)
        };
    },

    displayResult(result, type, selection) {
        const resultCard = document.getElementById('hedgeResult');
        const resultBody = document.getElementById('hedgeResultBody');

        resultCard.style.display = 'block';

        const typeLabels = {
            'win': '胜平负',
            'overunder': '大小球',
            'handicap': '让球盘'
        };

        const selectionLabels = {
            'home': '主胜',
            'draw': '平局',
            'away': '客胜',
            'over': '大球',
            'under': '小球'
        };

        const strategyLabels = {
            'guaranteed': '保底型',
            'balanced': '平衡型',
            'aggressive': '激进型'
        };

        const profitClass = result.guaranteedProfit >= 0 ? 'positive' : 'negative';

        resultBody.innerHTML = `
            <div class="result-summary">
                <div class="summary-item">
                    <div class="label">对冲投注额</div>
                    <div class="value">${Utils.formatCurrency(result.hedgeStake)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">总投入</div>
                    <div class="value">${Utils.formatCurrency(result.totalInvestment)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">保证盈亏</div>
                    <div class="value ${profitClass}">${Utils.formatCurrency(result.guaranteedProfit)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">ROI</div>
                    <div class="value ${profitClass}">${Utils.formatPercent(result.roi)}</div>
                </div>
            </div>

            <div class="result-details">
                <h4 style="margin-bottom: 12px;">方案详情</h4>
                <table>
                    <thead>
                        <tr>
                            <th>场景</th>
                            <th>原始投注</th>
                            <th>对冲投注</th>
                            <th>盈亏</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${selectionLabels[selection]} 赢</td>
                            <td>${Utils.formatCurrency(result.originalPotentialWin)}</td>
                            <td>-${Utils.formatCurrency(result.hedgeStake)}</td>
                            <td class="${profitClass}">${Utils.formatCurrency(result.originalPotentialWin - result.hedgeStake)}</td>
                        </tr>
                        <tr>
                            <td>对冲方赢</td>
                            <td>-${Utils.formatCurrency(result.originalStake)}</td>
                            <td>+${Utils.formatCurrency(result.hedgePotentialWin)}</td>
                            <td class="${profitClass}">${Utils.formatCurrency(result.hedgePotentialWin - result.originalStake)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 16px; padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                <p style="font-size: 13px; color: var(--text-secondary);">
                    <i class="fas fa-info-circle"></i>
                    <strong>策略说明：</strong>${strategyLabels[result.strategy]}策略下，无论比赛结果如何，
                    ${result.guaranteedProfit >= 0 ? '您都能保证获得' + Utils.formatCurrency(result.guaranteedProfit) + '的利润' : '您的最大亏损为' + Utils.formatCurrency(Math.abs(result.guaranteedProfit))}。
                </p>
            </div>
        `;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
