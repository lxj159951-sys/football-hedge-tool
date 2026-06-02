// ===== Arbitrage Calculator =====

const Arbitrage = {
    platformCount: 3, // 默认 3 个平台

    init() {
        this.bindEvents();
        this.setupPlatformSelector();
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

        // Add platform
        document.getElementById('addPlatform')?.addEventListener('click', () => this.addPlatform());

        // Remove platform (delegated)
        document.getElementById('outcomesList')?.addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove-platform')) {
                this.removePlatform(e.target.closest('.btn-remove-platform').dataset.platform);
            }
        });
    },

    setupPlatformSelector() {
        // 初始化平台数量选择器
        const selector = document.getElementById('platformCount');
        if (selector) {
            selector.value = this.platformCount;
            selector.addEventListener('change', (e) => {
                this.platformCount = parseInt(e.target.value);
                this.rebuildOutcomeRows();
            });
        }
    },

    rebuildOutcomeRows() {
        const list = document.getElementById('outcomesList');
        const existingOutcomes = [];

        // 保存现有数据
        list.querySelectorAll('.outcome-row').forEach(row => {
            const name = row.querySelector('.outcome-name')?.value || '';
            const odds = [];
            row.querySelectorAll('.outcome-odds-input').forEach(input => {
                odds.push(input.value);
            });
            existingOutcomes.push({ name, odds });
        });

        // 清空列表
        list.innerHTML = '';

        // 重新创建行
        if (existingOutcomes.length > 0) {
            existingOutcomes.forEach((outcome, index) => {
                this.addOutcomeWithData(outcome.name, outcome.odds);
            });
        } else {
            // 默认 3 个选项
            this.addOutcomeWithData('主胜', []);
            this.addOutcomeWithData('平局', []);
            this.addOutcomeWithData('客胜', []);
        }
    },

    addOutcome() {
        const list = document.getElementById('outcomesList');
        const count = list.children.length;

        if (count >= 10) {
            Utils.showToast('最多添加 10 个选项', 'warning');
            return;
        }

        this.addOutcomeWithData(`选项 ${count + 1}`, []);
    },

    addOutcomeWithData(name, oddsValues) {
        const list = document.getElementById('outcomesList');
        const index = list.children.length;

        const row = document.createElement('div');
        row.className = 'outcome-row';
        row.dataset.index = index;

        let platformInputs = '';
        for (let i = 0; i < this.platformCount; i++) {
            const value = oddsValues[i] || '';
            platformInputs += `
                <div class="form-group">
                    <label>平台 ${i + 1} 赔率</label>
                    <input type="number" class="outcome-odds-input" data-platform="${i}" step="0.01" min="1" placeholder="2.00" value="${value}">
                </div>
            `;
        }

        row.innerHTML = `
            <div class="form-group">
                <label>选项名称</label>
                <input type="text" class="outcome-name" value="${name}" placeholder="如：主胜">
            </div>
            ${platformInputs}
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

    addPlatform() {
        if (this.platformCount >= 6) {
            Utils.showToast('最多支持 6 个平台', 'warning');
            return;
        }
        this.platformCount++;
        document.getElementById('platformCount').value = this.platformCount;
        this.rebuildOutcomeRows();
    },

    removePlatform(platformIndex) {
        if (this.platformCount <= 2) {
            Utils.showToast('至少需要 2 个平台', 'warning');
            return;
        }
        this.platformCount--;
        document.getElementById('platformCount').value = this.platformCount;
        this.rebuildOutcomeRows();
    },

    getOutcomes() {
        const rows = document.querySelectorAll('.outcome-row');
        const outcomes = [];

        rows.forEach(row => {
            const name = row.querySelector('.outcome-name').value || '未知';
            const oddsInputs = row.querySelectorAll('.outcome-odds-input');
            const odds = [];

            oddsInputs.forEach(input => {
                const value = parseFloat(input.value);
                if (value && value > 1) {
                    odds.push(value);
                }
            });

            if (odds.length > 0) {
                // 使用最高赔率进行套利计算
                const bestOdds = Math.max(...odds);
                outcomes.push({
                    name,
                    bestOdds,
                    allOdds: odds
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

        // 构建表格头
        let tableHeaders = '<th>选项</th>';
        for (let i = 0; i < this.platformCount; i++) {
            tableHeaders += `<th>平台 ${i + 1}</th>`;
        }
        tableHeaders += '<th>最佳赔率</th><th>隐含概率</th><th>建议投注</th><th>潜在回报</th>';

        // 构建表格内容
        let tableRows = '';
        outcomes.forEach((o, i) => {
            let oddsCells = '';
            for (let j = 0; j < this.platformCount; j++) {
                const oddsValue = o.allOdds[j] || '-';
                const isBest = o.allOdds[j] === o.bestOdds;
                oddsCells += `<td ${isBest ? 'style="color: var(--success); font-weight: bold;"' : ''}>${oddsValue !== '-' ? Utils.formatOdds(oddsValue) : '-'}</td>`;
            }

            tableRows += `
                <tr>
                    <td>${o.name}</td>
                    ${oddsCells}
                    <td style="color: var(--success); font-weight: bold;">${Utils.formatOdds(o.bestOdds)}</td>
                    <td>${Utils.formatPercent(Utils.impliedProbability(o.bestOdds))}</td>
                    <td>${Utils.formatCurrency(stakes[i])}</td>
                    <td>${Utils.formatCurrency(stakes[i] * o.bestOdds)}</td>
                </tr>
            `;
        });

        // Details table
        details.innerHTML = `
            <table>
                <thead>
                    <tr>${tableHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                    <tr style="font-weight: bold; background: var(--bg-hover);">
                        <td>合计</td>
                        ${'<td>-</td>'.repeat(this.platformCount)}
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
