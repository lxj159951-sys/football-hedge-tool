// ===== Poisson Prediction Model =====

const Prediction = {
    charts: {},

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('calculatePrediction').addEventListener('click', () => this.calculate());
        document.getElementById('loadTeamData').addEventListener('click', () => this.loadFromApi());
    },

    async loadFromApi() {
        const apiConfig = Store.getApiConfig();
        if (!apiConfig.connected) {
            Utils.showToast('请先配置并连接 API', 'warning');
            return;
        }

        Utils.showToast('正在从 API 加载数据...', 'info');
        // API loading logic would go here
        // For now, show a message
        Utils.showToast('API 数据加载功能开发中', 'warning');
    },

    calculate() {
        const homeTeam = document.getElementById('homeTeamName').value || '主队';
        const awayTeam = document.getElementById('awayTeamName').value || '客队';
        const homeGF = parseFloat(document.getElementById('homeGoalsFor').value);
        const homeGA = parseFloat(document.getElementById('homeGoalsAgainst').value);
        const awayGF = parseFloat(document.getElementById('awayGoalsFor').value);
        const awayGA = parseFloat(document.getElementById('awayGoalsAgainst').value);

        if (isNaN(homeGF) || isNaN(homeGA) || isNaN(awayGF) || isNaN(awayGA)) {
            Utils.showToast('请填写完整的球队数据', 'error');
            return;
        }

        // Calculate expected goals using Poisson model
        // Home attack strength * Away defense weakness
        const homeExpectedGoals = (homeGF + awayGA) / 2;
        // Away attack strength * Home defense weakness
        const awayExpectedGoals = (awayGF + homeGA) / 2;

        // Calculate score probabilities
        const maxGoals = 8;
        const scoreMatrix = [];
        let homeWinProb = 0, drawProb = 0, awayWinProb = 0;
        let over25Prob = 0, under25Prob = 0;
        let bttsYesProb = 0, bttsNoProb = 0;

        for (let i = 0; i <= maxGoals; i++) {
            scoreMatrix[i] = [];
            for (let j = 0; j <= maxGoals; j++) {
                const prob = Utils.poissonProbability(homeExpectedGoals, i) *
                             Utils.poissonProbability(awayExpectedGoals, j);
                scoreMatrix[i][j] = prob;

                // Win/Draw/Lose
                if (i > j) homeWinProb += prob;
                else if (i === j) drawProb += prob;
                else awayWinProb += prob;

                // Over/Under 2.5
                if (i + j > 2.5) over25Prob += prob;
                else under25Prob += prob;

                // BTTS
                if (i > 0 && j > 0) bttsYesProb += prob;
                else bttsNoProb += prob;
            }
        }

        // Get top scores
        const topScores = this.getTopScores(scoreMatrix, 10);

        const result = {
            homeTeam,
            awayTeam,
            homeExpectedGoals: homeExpectedGoals.toFixed(2),
            awayExpectedGoals: awayExpectedGoals.toFixed(2),
            homeWinProb: homeWinProb * 100,
            drawProb: drawProb * 100,
            awayWinProb: awayWinProb * 100,
            over25Prob: over25Prob * 100,
            under25Prob: under25Prob * 100,
            bttsYesProb: bttsYesProb * 100,
            bttsNoProb: bttsNoProb * 100,
            topScores,
            scoreMatrix
        };

        this.displayResult(result);
    },

    getTopScores(matrix, count) {
        const scores = [];
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                scores.push({
                    home: i,
                    away: j,
                    score: `${i}-${j}`,
                    probability: matrix[i][j] * 100
                });
            }
        }
        return scores.sort((a, b) => b.probability - a.probability).slice(0, count);
    },

    displayResult(result) {
        const resultCard = document.getElementById('predictionResult');
        const summary = document.getElementById('predictionSummary');
        const table = document.getElementById('predictionTable');

        resultCard.style.display = 'block';

        // Summary
        summary.innerHTML = `
            <div class="prob-card home">
                <div class="team-name">${result.homeTeam} 胜</div>
                <div class="prob-value" style="color: var(--info);">${Utils.formatPercent(result.homeWinProb)}</div>
            </div>
            <div class="prob-card draw">
                <div class="team-name">平局</div>
                <div class="prob-value" style="color: var(--warning);">${Utils.formatPercent(result.drawProb)}</div>
            </div>
            <div class="prob-card away">
                <div class="team-name">${result.awayTeam} 胜</div>
                <div class="prob-value" style="color: var(--success);">${Utils.formatPercent(result.awayWinProb)}</div>
            </div>
        `;

        // Charts
        this.renderWinProbChart(result);
        this.renderScoreProbChart(result);

        // Score table
        table.innerHTML = `
            <h4 style="margin-bottom: 12px;">比分概率表</h4>
            <table>
                <thead>
                    <tr>
                        <th>比分</th>
                        <th>概率</th>
                        <th>概率条</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.topScores.map(s => `
                        <tr>
                            <td><strong>${s.score}</strong></td>
                            <td>${Utils.formatPercent(s.probability)}</td>
                            <td>
                                <div style="background: var(--bg-primary); border-radius: 4px; height: 20px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); width: ${s.probability * 3}%; height: 100%;"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <div style="padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-muted);">预期进球数</div>
                    <div style="font-size: 18px; font-weight: 700;">
                        ${result.homeTeam}: ${result.homeExpectedGoals} | ${result.awayTeam}: ${result.awayExpectedGoals}
                    </div>
                </div>
                <div style="padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-muted);">大小球 2.5</div>
                    <div style="font-size: 18px; font-weight: 700;">
                        大: ${Utils.formatPercent(result.over25Prob)} | 小: ${Utils.formatPercent(result.under25Prob)}
                    </div>
                </div>
                <div style="padding: 12px; background: var(--bg-primary); border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-muted);">双方进球</div>
                    <div style="font-size: 18px; font-weight: 700;">
                        是: ${Utils.formatPercent(result.bttsYesProb)} | 否: ${Utils.formatPercent(result.bttsNoProb)}
                    </div>
                </div>
            </div>
        `;

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderWinProbChart(result) {
        const ctx = document.getElementById('winProbChart').getContext('2d');

        if (this.charts.winProb) {
            this.charts.winProb.destroy();
        }

        this.charts.winProb = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [`${result.homeTeam} 胜`, '平局', `${result.awayTeam} 胜`],
                datasets: [{
                    data: [result.homeWinProb, result.drawProb, result.awayWinProb],
                    backgroundColor: [
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(240, 165, 0, 0.8)',
                        'rgba(67, 233, 123, 0.8)'
                    ],
                    borderColor: [
                        'rgba(79, 172, 254, 1)',
                        'rgba(240, 165, 0, 1)',
                        'rgba(67, 233, 123, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0a3b1',
                            padding: 16,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    renderScoreProbChart(result) {
        const ctx = document.getElementById('scoreProbChart').getContext('2d');

        if (this.charts.scoreProb) {
            this.charts.scoreProb.destroy();
        }

        this.charts.scoreProb = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: result.topScores.map(s => s.score),
                datasets: [{
                    label: '概率',
                    data: result.topScores.map(s => s.probability),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '概率: ' + context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#a0a3b1',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(45, 48, 68, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a0a3b1'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};
