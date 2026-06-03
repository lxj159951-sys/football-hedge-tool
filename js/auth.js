// ===== 用户登录/注册模块 =====

const Auth = {
    currentUser: null,
    isLoggedIn: false,

    init() {
        this.loadUser();
        this.bindEvents();
        this.updateUI();
    },

    loadUser() {
        this.currentUser = Store.getUser();
        this.isLoggedIn = !!this.currentUser;
    },

    bindEvents() {
        // 登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // 退出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // 登录表单提交
        const loginSubmit = document.getElementById('loginSubmit');
        if (loginSubmit) {
            loginSubmit.addEventListener('click', () => this.handleLogin());
        }

        // 注册表单提交
        const registerSubmit = document.getElementById('registerSubmit');
        if (registerSubmit) {
            registerSubmit.addEventListener('click', () => this.handleRegister());
        }

        // 切换登录/注册
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', () => this.switchForm('register'));
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => this.switchForm('login'));
        }

        // 关闭弹窗
        const closeModal = document.getElementById('closeAuthModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideLoginModal());
        }

        // 点击遮罩关闭
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) this.hideLoginModal();
            });
        }
    },

    showLoginModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchForm('login');
        }
    },

    hideLoginModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    switchForm(type) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (type === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    },

    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            Utils.showToast('请输入用户名和密码', 'warning');
            return;
        }

        const user = Store.findUser(username, password);
        if (user) {
            this.currentUser = user;
            this.isLoggedIn = true;
            Store.setUser(user);
            this.updateUI();
            this.hideLoginModal();
            Utils.showToast('登录成功', 'success');
        } else {
            Utils.showToast('用户名或密码错误', 'error');
        }
    },

    handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!username || !password) {
            Utils.showToast('请输入用户名和密码', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showToast('两次密码输入不一致', 'warning');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('密码长度不能少于6位', 'warning');
            return;
        }

        const existingUser = Store.findUserByUsername(username);
        if (existingUser) {
            Utils.showToast('用户名已存在', 'error');
            return;
        }

        const newUser = Store.addUser({
            username,
            password,
            endtime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

        this.currentUser = newUser;
        this.isLoggedIn = true;
        Store.setUser(newUser);
        this.updateUI();
        this.hideLoginModal();
        Utils.showToast('注册成功', 'success');
    },

    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.currentUser = null;
            this.isLoggedIn = false;
            Store.removeUser();
            this.updateUI();
            Utils.showToast('已退出登录', 'info');
        }
    },

    updateUI() {
        const userSection = document.getElementById('userInfoSection');
        if (!userSection) return;

        if (this.isLoggedIn && this.currentUser) {
            const endtime = this.currentUser.endtime;
            const remainText = this.getRemainText(endtime);

            userSection.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <span class="username">${Utils.escapeHtml(this.currentUser.username)}</span>
                    <span class="user-status ${remainText === '已到期' ? 'expired' : 'active'}">
                        ${remainText}
                    </span>
                </div>
                <button class="btn-icon btn-logout" id="logoutBtn" title="退出登录">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
        } else {
            userSection.innerHTML = `
                <button class="btn btn-primary btn-sm" id="loginBtn">
                    <i class="fas fa-sign-in-alt"></i> 登录
                </button>
            `;
        }

        // 重新绑定事件
        this.bindEvents();
    },

    getRemainText(endtime) {
        if (!endtime) return '未设置';

        const end = new Date(endtime).getTime();
        if (!end) return '未设置';

        const now = Date.now();
        const diff = end - now;

        if (diff <= 0) return '已到期';

        const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
        return `${days} 天`;
    },

    isLoggedIn() {
        return this.isLoggedIn;
    },

    getCurrentUser() {
        return this.currentUser;
    }
};
