// ===== Arbitrage Calculator =====

const Arbitrage = {
    init() {
        this.bindEvents();
        this.loadDefaultOutcomes();
    },

    bindEvents() {
        // Add outcome
        document.getElementById('addOutcome').addEventListener('click', () => this.addOutcome());

        // Calculate
        document.getElementById('calculateArb').addEventListener('click', () => this.calculate());

        // Remove outcome (delegated)
        document.getElementById('outcomesList').addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove')) {
                this.removeOutcome(e.target.closest('.outcome-row'));
            }
        });
    },

    loadDefaultOutcomes() {
        // Already loaded in HTML
    },

    addOutcome() {
        const list = document.getElementById('outcomesList');
        const count = list.children.length;

        if (count >= 10) {
            Utils.showToast('最多添加 10 个选项', 'warning');
            return;
        }

        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.dataset.index = count;
        row.innerHTML = `
            <div class="form-group">
                <label>选项名称</label>
                <input type="text" class="outcome-name" value="选项 ${count + 1}" placeholder="如：主胜">
            </div>
            <div class="form-group">
                <label>平台 1 赔率</label>
                <input type="number" class="outcome-odds" step="0.01" min="1" placeholder="2.00">
            </div>
            <div class="form-group">
                <label>平台 2 赔率</label>
                <input type="number" class="outcome-odds-alt" step="0.01" min="1" placeholder="2.00">
            </div>
            <button class="btn-icon btn-remove" title="删除">
                <i class="fas fa-times"></i>
            </button>
        `;

        list.appendChild(row);
    },

    removeOutcome(row) {
        const list = document.getElementById('outcomesList');
        if (list.children.length <= 2) {
            Utils.showToast('至少需要 2 个选项', 'warning');
            return;
        }
        row.remove();
    },

    getOutcomes() {
        const rows = document.querySelectorAll('.outcome-row');
        const outcomes = [];

        rows.forEach(row => {
            const name = row.querySelector('.outcome-name').value || '未知';
            const odds1 = parseFloat(row.querySelector('.outcome-odds').value);
            const odds2 = parseFloat(row.querySelector('.outcome-odds-alt').value);

            if (odds1 && odds2) {
                // Use the better odds for arbitrage
                outcomes.push({
                    name,
                    bestOdds: Math.max(odds1, odds2),
                    odds1,
                    odds2
                });
            }
        });

        return outcomes;
    },

    calculate() {
        const outcomes = this.getOutcomes();
        const totalStake = parseFloat(document.getElementById('arbTotalStake').value) || 1000;

        if (outcomes.length < 2) {
            Utils.showToast('请至少输入 2 个有效选项', 'error');
            return;
        }

        const oddsArray = outcomes.map(o => o.bestOdds);
        const arbCheck = Utils.checkArbitrage(oddsArray);
        const stakes = Utils.calculateArbitrageStakes(oddsArray, totalStake);

        this.displayResult(outcomes, stakes, arbCheck, totalStake);
    },

    displayResult(outcomes, stakes, arbCheck, totalStake) {
        const resultCard = document.getElementById('arbResult');
        const statusBadge = document.getElementById('arbStatus');
        const summary = document.getElementById('arbSummary');
        const details = document.getElementById('arbDetails');

        resultCard.style.display = 'block';

        // Status badge
        if (arbCheck.isArbitrage) {
            statusBadge.className = 'badge success';
            statusBadge.textContent = '✅ 存在套利机会';
        } else {
            statusBadge.className = 'badge danger';
            statusBadge.textContent = '❌ 无套利机会';
        }

        // Calculate potential profit
        const totalStakes = stakes.reduce((sum, s) => sum + s, 0);
        const potentialReturns = outcomes.map((o, i) => stakes[i] * o.bestOdds);
        const guaranteedReturn = Math.min(...potentialReturns);
        const profit = guaranteedReturn - totalStakes;
        const roi = (profit / totalStakes) * 100;

        // Summary
        summary.innerHTML = `
            <div class="summary-item">
                <div class="label">总投注</div>
                <div class="value">${Utils.formatCurrency(totalStakes)}</div>
            </div>
            <div class="summary-item">
                <div class="label">保证回报</div>
                <div class="value ${profit >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(guaranteedReturn)}</div>
            </div>
            <div class="summary-item">
                <div class="label">${arbCheck.isArbitrage ? '保证利润' : '最小亏损'}</div>
                <div class="value ${profit >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(profit)}</div>
            </div>
            <div class="summary-item">
                <div class="label">ROI</div>
                <div class="value ${roi >= 0 ? 'positive' : 'negative'}">${Utils.formatPercent(roi)}</div>
            </div>
            <div class="summary-item">
                <div class="label">套利空间</div>
                <div class="value">${Utils.formatPercent(arbCheck.margin)}</div>
            </div>
        `;

        // Details table
        details.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>选项</th>
                        <th>最佳赔率</th>
                        <th>隐含概率</th>
                        <th>建议投注</th>
                        <th>潜在回报</th>
                    </tr>
                </thead>
                <tbody>
                    ${outcomes.map((o, i) => `
                        <tr>
                            <td>${o.name}</td>
                            <td>${Utils.formatOdds(o.bestOdds)}</td>
                            <td>${Utils.formatPercent(Utils.impliedProbability(o.bestOdds))}</td>
                            <td>${Utils.formatCurrency(stakes[i])}</td>
                            <td>${Utils.formatCurrency(stakes[i] * o.bestOdds)}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background: var(--bg-hover);">
                        <td>合计</td>
                        <td>-</td>
                        <td>${Utils.formatPercent(arbCheck.totalImplied)}</td>
                        <td>${Utils.formatCurrency(totalStakes)}</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
        `;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
