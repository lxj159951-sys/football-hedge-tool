# CORS 解决方案

## 问题说明

浏览器出于安全考虑，会阻止网页直接访问不同域名的 API（CORS 限制）。

## 解决方案

### 方案 1：本地代理服务器（开发环境）

```bash
# 启动本地代理
node local-proxy.js

# 或者使用 npm
npm start
```

代理服务器会运行在 `http://localhost:3001`，自动转发 API 请求。

### 方案 2：Vercel 代理（生产环境推荐）

1. 将项目部署到 Vercel
2. Vercel 会自动使用 `api/proxy.js` 作为代理函数
3. 前端代码会自动检测并使用代理

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 方案 3：浏览器扩展（临时测试）

安装 Chrome 扩展 "Allow CORS: Access-Control-Allow-Origin"

⚠️ 注意：仅用于开发测试，不要在浏览其他网站时开启

### 方案 4：强制连接（跳过测试）

在 API 配置页面，点击 "强制连接" 按钮，直接标记为已连接。

适用于：
- 已知 API 有效，但 CORS 阻止测试
- 使用其他方式解决 CORS（如浏览器扩展）

## 工作原理

### 代理模式

```
浏览器 → 代理服务器 → RapidAPI
         ↑
    代理服务器添加 CORS 头
```

### 直接模式（可能失败）

```
浏览器 → RapidAPI
         ↑
    CORS 限制阻止
```

## 配置说明

在 `js/apiconfig.js` 中可以配置代理：

```javascript
PROXY_CONFIG: {
    local: 'http://localhost:3001',    // 本地代理
    vercel: '/api/proxy',              // Vercel 代理
    useProxy: true                     // 是否启用代理
}
```

## 自动检测

代码会自动检测运行环境：

- `localhost` → 使用本地代理
- `*.vercel.app` → 使用 Vercel 代理
- 其他（如 GitHub Pages）→ 直接请求（可能遇到 CORS）

## 建议

| 环境 | 建议方案 |
|------|----------|
| 本地开发 | 本地代理服务器 |
| Vercel 部署 | Vercel 代理函数 |
| GitHub Pages | 浏览器扩展 或 强制连接 |
