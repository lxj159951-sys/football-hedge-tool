// ===== 对冲配置管理模块 =====

const HedgeConfig = {
    config: null,

    init() {
        this.loadConfig();
        this.bindEvents();
        this.loadConfigToForm();
    },

    loadConfig() {
        this.config = Store.getHedgeConfig();
    },

    bindEvents() {
        // 保存配置
        const saveBtn = document.getElementById('saveHedgeConfig');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfig());
        }

        // 恢复默认
        const resetBtn = document.getElementById('resetHedgeConfig');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetConfig());
        }
    },

    loadConfigToForm() {
        if (!this.config) return;

        // 足球配置
        document.getElementById('configFtTwoOneCF').value = this.config.football.twoOne.cf;
        document.getElementById('configFtTwoOneWF').value = this.config.football.twoOne.wf;
        document.getElementById('configFtSingleCF').value = this.config.football.single.cf;
        document.getElementById('configFtSingleWF').value = this.config.football.single.wf;
        document.getElementById('configFtGoalsCF').value = this.config.football.goals.cf;
        document.getElementById('configFtGoalsWF').value = this.config.football.goals.wf;
        document.getElementById('configFtHalfFullCF').value = this.config.football.halfFull.cf;
        document.getElementById('configFtHalfFullWF').value = this.config.football.halfFull.wf;
        document.getElementById('configFtFullCoverCF').value = this.config.football.fullCover.cf;
        document.getElementById('configFtFullCoverCF2').value = this.config.football.fullCover.cf2;
        document.getElementById('configFtFullCoverWF').value = this.config.football.fullCover.wf;

        // 篮球配置
        document.getElementById('configBkTwoOneCF').value = this.config.basketball.twoOne.cf;
        document.getElementById('configBkTwoOneWF').value = this.config.basketball.twoOne.wf;
        document.getElementById('configBkSingleCF').value = this.config.basketball.single.cf;
        document.getElementById('configBkSingleWF').value = this.config.basketball.single.wf;

        // 通用设置
        document.getElementById('configSound').checked = this.config.general.sound;
        document.getElementById('configInterval').value = this.config.general.interval;
        document.getElementById('configMinRate').value = this.config.general.minrate;
        document.getElementById('configMaxMultiple').value = this.config.general.maxmultiple;
    },

    saveConfig() {
        // 从表单读取配置
        this.config = {
            football: {
                twoOne: {
                    cf: parseFloat(document.getElementById('configFtTwoOneCF').value) || 14,
                    wf: parseFloat(document.getElementById('configFtTwoOneWF').value) || 2.0
                },
                single: {
                    cf: parseFloat(document.getElementById('configFtSingleCF').value) || 12,
                    wf: parseFloat(document.getElementById('configFtSingleWF').value) || 2.0
                },
                newSingle: {
                    cf: parseFloat(document.getElementById('configFtSingleCF').value) || 12,
                    wf: parseFloat(document.getElementById('configFtSingleWF').value) || 2.0
                },
                goals: {
                    cf: parseFloat(document.getElementById('configFtGoalsCF').value) || 12,
                    wf: parseFloat(document.getElementById('configFtGoalsWF').value) || 2.0
                },
                halfFull: {
                    cf: parseFloat(document.getElementById('configFtHalfFullCF').value) || 12,
                    wf: parseFloat(document.getElementById('configFtHalfFullWF').value) || 2.0
                },
                fullCover: {
                    cf: parseFloat(document.getElementById('configFtFullCoverCF').value) || 14,
                    cf2: parseFloat(document.getElementById('configFtFullCoverCF2').value) || 14,
                    wf: parseFloat(document.getElementById('configFtFullCoverWF').value) || 2.0
                }
            },
            basketball: {
                twoOne: {
                    cf: parseFloat(document.getElementById('configBkTwoOneCF').value) || 26,
                    wf: parseFloat(document.getElementById('configBkTwoOneWF').value) || 1.2
                },
                single: {
                    cf: parseFloat(document.getElementById('configBkSingleCF').value) || 25,
                    wf: parseFloat(document.getElementById('configBkSingleWF').value) || 1.2
                },
                newSingle: {
                    cf: parseFloat(document.getElementById('configBkSingleCF').value) || 25,
                    wf: parseFloat(document.getElementById('configBkSingleWF').value) || 1.2
                }
            },
            general: {
                gl: 0,
                bsgl: '',
                guolv: 'all',
                sound: document.getElementById('configSound').checked,
                interval: parseInt(document.getElementById('configInterval').value) || 10,
                autoflash: true,
                minrate: document.getElementById('configMinRate').value || '0',
                maxmultiple: parseInt(document.getElementById('configMaxMultiple').value) || 10
            }
        };

        // 保存到本地存储
        Store.updateHedgeConfig(this.config);

        // 更新默认值
        this.updateDefaultValues();

        Utils.showToast('配置已保存', 'success');
    },

    resetConfig() {
        if (!confirm('确定要恢复默认配置吗？')) {
            return;
        }

        // 使用默认配置
        this.config = Store.getHedgeConfig.call({ get: Store.get.bind(Store) }, Store.KEYS.HEDGE_CONFIG);

        // 重新加载到表单
        this.loadConfigToForm();

        // 保存默认配置
        Store.updateHedgeConfig(this.config);

        Utils.showToast('已恢复默认配置', 'success');
    },

    updateDefaultValues() {
        // 更新各个计算模块的默认值
        if (typeof TwoOne !== 'undefined') {
            document.getElementById('twoOneCF').value = this.config.football.twoOne.cf;
        }
        if (typeof Single !== 'undefined') {
            document.getElementById('singleCF').value = this.config.football.single.cf;
        }
        if (typeof Goals !== 'undefined') {
            document.getElementById('goalsCF').value = this.config.football.goals.cf;
        }
        if (typeof BkTwoOne !== 'undefined') {
            document.getElementById('bkTwoOneCF').value = this.config.basketball.twoOne.cf;
        }
        if (typeof BkSingle !== 'undefined') {
            document.getElementById('bkSingleCF').value = this.config.basketball.single.cf;
        }
    },

    getConfig(sport, playType) {
        if (!this.config) this.loadConfig();
        return this.config[sport]?.[playType] || {};
    },

    getGeneralConfig() {
        if (!this.config) this.loadConfig();
        return this.config.general || {};
    }
};
