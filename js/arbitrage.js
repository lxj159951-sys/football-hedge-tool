// ===== Arbitrage Calculator =====

const Arbitrage = {
    platformCount: 3, // 默认 3 个平台

    // 预设选项类型
    outcomeTypes: {
        'win-draw-lose': {
            name: '胜平负',
            outcomes: ['主胜', '平局', '客胜']
        },
        'over-under': {
            name: '大小球',
            outcomes: ['大球', '小球']
        },
        'over-under-25': {
            name: '大小球 2.5',
            outcomes: ['大 2.5', '小 2.5']
        },
        'over-under-15': {
            name: '大小球 1.5',
            outcomes: ['大 1.5', '小 1.5']
        },
        'over-under-35': {
            name: '大小球 3.5',
            outcomes: ['大 3.5', '小 3.5']
        },
        'handicap': {
            name: '让球盘',
            outcomes: ['主队让球', '客队让球']
        },
        'btts': {
            name: '双方进球',
            outcomes: ['是', '否']
        },
        'double-chance': {
            name: '双重机会',
            outcomes: ['主胜或平', '客胜或平', '主胜或客胜']
        },
        'custom': {
            name: '自定义',
            outcomes: []
        }
    },

    init() {
        this.bindEvents();
        this.setupPlatformSelector();
        this.setupOutcomeTypeSelector();
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

    setupPlatformSelector() {
        const selector = document.getElementById('platformCount');
        if (selector) {
            selector.value = this.platformCount;
            selector.addEventListener('change', (e) => {
                this.platformCount = parseInt(e.target.value);
                this.rebuildOutcomeRows();
            });
        }
    },

    setupOutcomeTypeSelector() {
        const selector = document.getElementById('outcomeType');
        if (!selector) return;

        // 填充选项类型
        Object.entries(this.outcomeTypes).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.name;
            selector.appendChild(option);
        });

        selector.value = 'win-draw-lose';

        selector.addEventListener('change', (e) => {
            this.loadOutcomesByType(e.target.value);
        });
    },

    loadDefaultOutcomes() {
        this.loadOutcomesByType('win-draw-lose');
    },

    loadOutcomesByType(type) {
        const list = document.getElementById('outcomesList');
        list.innerHTML = '';

        const typeConfig = this.outcomeTypes[type];
        if (!typeConfig) return;

        if (type === 'custom') {
            // 自定义模式：添加空行
            this.addOutcome();
            this.addOutcome();
        } else {
            // 预设模式：添加预定义选项
            typeConfig.outcomes.forEach(name => {
                this.addOutcomeWithData(name, []);
            });
        }
    },

    rebuildOutcomeRows() {
        const list = document.getElementById('outcomesList');
        const existingOutcomes = [];

        // 保存现有数据
        list.querySelectorAll('.outcome-row').forEach(row => {
            const name = row.querySelector('.outcome-name-select')?.value ||
                         row.querySelector('.outcome-name')?.value || '';
            const odds = [];
            row.querySelectorAll('.outcome-odds-input').forEach(input => {
                odds.push(input.value);
            });
            existingOutcomes.push({ name, odds });
        });

        // 清空列表
        list.innerHTML = '';

        // 重新创建行
        existingOutcomes.forEach(outcome => {
            this.addOutcomeWithData(outcome.name, outcome.odds);
        });
    },

    addOutcome() {
        const list = document.getElementById('outcomesList');
        const count = list.children.length;

        if (count >= 10) {
            Utils.showToast('最多添加 10 个选项', 'warning');
            return;
        }

        this.addOutcomeWithData('', []);
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
                    <label>平台 ${i + 1}</label>
                    <input type="number" class="outcome-odds-input" data-platform="${i}" step="0.01" min="1" placeholder="赔率" value="${value}">
                </div>
            `;
        }

        // 获取当前选中的类型
        const currentType = document.getElementById('outcomeType')?.value || 'custom';
        const typeConfig = this.outcomeTypes[currentType];

        // 如果是预设类型，使用下拉选择；否则使用输入框
        let nameInput = '';
        if (currentType !== 'custom' && typeConfig && typeConfig.outcomes.length > 0) {
            const options = typeConfig.outcomes.map(outcome =>
                `<option value="${outcome}" ${outcome === name ? 'selected' : ''}>${outcome}</option>`
            ).join('');
            nameInput = `
                <div class="form-group">
                    <label>选项</label>
                    <select class="outcome-name-select">${options}</select>
                </div>
            `;
        } else {
            nameInput = `
                <div class="form-group">
                    <label>选项名称</label>
                    <input type="text" class="outcome-name" value="${name}" placeholder="如：主胜">
                </div>
            `;
        }

        row.innerHTML = `
            ${nameInput}
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

    getOutcomes() {
        const rows = document.querySelectorAll('.outcome-row');
        const outcomes = [];

        rows.forEach(row => {
            // 获取选项名称（优先使用下拉选择框）
            const nameSelect = row.querySelector('.outcome-name-select');
            const nameInput = row.querySelector('.outcome-name');
            const name = nameSelect?.value || nameInput?.value || '未知';

            const oddsInputs = row.querySelectorAll('.outcome-odds-input');
            const odds = [];

            oddsInputs.forEach(input => {
                const value = parseFloat(input.value);
                if (value && value > 1) {
                    odds.push(value);
                }
            });

            if (odds.length > 0) {
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
