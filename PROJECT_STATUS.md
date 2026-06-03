# 足球预测工具 - 项目状态

> 最后更新：2026-06-03

---

## 📊 项目概述

一个功能完整的足球预测和对冲计算工具，支持实时比赛数据、多种盘口计算、智能预测等功能。

---

## ✅ 已完成的功能

### 核心功能
| 功能 | 状态 | 说明 |
|------|------|------|
| 比赛中心 | ✅ 完成 | 显示实时比赛数据，支持搜索 |
| 套利计算器 | ✅ 完成 | 支持 2-6 个平台，多种盘口类型 |
| 盘中对冲 | ✅ 完成 | 保底型、平衡型、激进型三种策略 |
| 凯利公式 | ✅ 完成 | 计算最优下注比例 |
| 智能预测 | ✅ 完成 | 泊松分布模型预测比分概率 |
| 价值投注 | ✅ 完成 | 发现赔率与概率的价值差 |
| 投注记录 | ✅ 完成 | 记录、筛选、导出投注数据 |
| 资金管理 | ✅ 完成 | 止损、盈利目标、资金走势图 |

### API 集成
| 功能 | 状态 | 说明 |
|------|------|------|
| RapidAPI 集成 | ✅ 完成 | 使用 footapi7 API |
| Vercel 代理 | ✅ 完成 | 解决 CORS 问题 |
| 本地代理 | ✅ 完成 | 开发环境使用 |

---

## 🌐 部署信息

### Vercel（主要）
- **网址**: https://football-hedge-tool.vercel.app
- **状态**: ✅ 正常运行
- **API 代理**: ✅ 正常工作

### GitHub（代码仓库）
- **仓库**: https://github.com/lxj159951-sys/football-hedge-tool
- **状态**: ✅ 代码已推送
- **Pages**: ⏳ 待配置

---

## ⏳ 待完成任务

### 1. GitHub Pages 部署
**问题**: Token 权限不足，无法自动开启 Pages

**解决方案**:
1. 创建经典 Token（ghp_ 开头）
2. 勾选 repo 权限
3. 手动开启 Pages 或用 GitHub Actions

### 2. GitHub Pages 手动开启步骤
1. 打开: https://github.com/lxj159951-sys/football-hedge-tool/settings/pages
2. Source 选择: GitHub Actions
3. 保存

---

## 🔧 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **图表**: Chart.js
- **图标**: Font Awesome
- **数据存储**: localStorage
- **API**: RapidAPI (footapi7)
- **部署**: Vercel
- **代理**: Vercel Serverless Functions

---

## 📁 项目结构

```
E:\projects\football-hedge-tool\
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式（深色主题）
├── js/
│   ├── config.js           # API 配置（不上传 GitHub）
│   ├── config.example.js   # API 配置示例
│   ├── utils.js            # 工具函数
│   ├── store.js            # 数据存储
│   ├── app.js              # 主程序
│   ├── arbitrage.js        # 套利计算器
│   ├── hedge.js            # 盘中对冲
│   ├── kelly.js            # 凯利公式
│   ├── prediction.js       # 智能预测
│   ├── valuebet.js         # 价值投注
│   ├── records.js          # 投注记录
│   ├── bankroll.js         # 资金管理
│   ├── apiconfig.js        # API 配置
│   └── matches.js          # 比赛数据
├── api/
│   └── proxy.js            # Vercel 代理函数
├── local-proxy.js          # 本地代理服务器
├── package.json            # npm 配置
├── vercel.json             # Vercel 配置
└── .gitignore              # Git 忽略文件
```

---

## 🔐 API 配置

### RapidAPI
- **Host**: footapi7.p.rapidapi.com
- **Key**: 存储在 js/config.js（不上传 GitHub）

### 代理配置
- **本地代理**: http://localhost:3001
- **Vercel 代理**: /api/proxy

---

## 💡 重要提醒

1. **API Key 安全**: 不要将 API Key 提交到 GitHub
2. **本地代理**: 开发时需要运行 `node local-proxy.js`
3. **Vercel 部署**: 运行 `vercel deploy --prod --yes`
4. **GitHub 推送**: 需要配置 Token 权限

---

## 📝 下次继续

1. 打开项目: `E:\projects\football-hedge-tool`
2. 启动本地代理: `node local-proxy.js`
3. 打开网页: `index.html` 或访问 Vercel 网址
4. 继续开发新功能

---

## 🎯 可能的后续功能

- [ ] 更多数据源 API
- [ ] 历史数据分析
- [ ] 比赛提醒功能
- [ ] 多语言支持
- [ ] 移动端 App

---

**项目状态**: 基本功能完成，可正常使用
**最后更新**: 2026-06-03
