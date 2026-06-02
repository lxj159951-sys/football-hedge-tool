// 本地代理服务器 - 解决开发环境 CORS 问题
// 使用方法: node local-proxy.js

const http = require('http');
const https = require('https');

const PORT = 3001;
const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const API_KEY = '3578074cb7msh73f3a9e20e60e06p1fe94fjsnc36c0746bd2e';

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 解析请求 URL
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Missing endpoint parameter',
            usage: 'http://localhost:3001?endpoint=football-players-search&search=test'
        }));
        return;
    }

    // 构建 API URL
    const apiUrl = new URL(`https://${API_HOST}/${endpoint}`);
    url.searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
            apiUrl.searchParams.append(key, value);
        }
    });

    console.log(`[Proxy] ${apiUrl.toString()}`);

    // 发起 HTTPS 请求
    const options = {
        hostname: API_HOST,
        path: apiUrl.pathname + apiUrl.search,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': API_HOST,
            'x-rapidapi-key': API_KEY
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    });

    proxyReq.on('error', (error) => {
        console.error('[Proxy Error]', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Failed to fetch from API',
            message: error.message
        }));
    });

    proxyReq.end();
});

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🚀 本地代理服务器已启动                          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║   地址: http://localhost:${PORT}                            ║
║                                                           ║
║   使用方法:                                               ║
║   http://localhost:${PORT}?endpoint=football-players-search&search=test
║                                                           ║
║   在浏览器控制台测试:                                     ║
║   fetch('http://localhost:${PORT}?endpoint=football-players-search&search=m')
║     .then(r => r.json()).then(console.log)                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
