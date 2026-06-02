// 本地代理服务器 - 解决开发环境 CORS 问题
// 使用方法: node local-proxy.js

const http = require('http');
const https = require('https');

const PORT = 3001;
const API_HOST = 'footapi7.p.rapidapi.com';

// 尝试从环境变量或配置文件读取 API Key
let API_KEY = process.env.RAPIDAPI_KEY || '';
try {
    // 尝试读取 config.js（如果存在）
    const fs = require('fs');
    const configContent = fs.readFileSync('./js/config.js', 'utf8');
    const match = configContent.match(/RAPIDAPI_KEY:\s*['"]([^'"]+)['"]/);
    if (match) {
        API_KEY = match[1];
    }
} catch (e) {
    // config.js 不存在，使用环境变量
}

if (!API_KEY) {
    console.warn('Warning: No API Key found. Please set RAPIDAPI_KEY environment variable or create js/config.js');
}

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-rapidapi-key, x-rapidapi-host');

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
            usage: 'http://localhost:3001?endpoint=matches/live'
        }));
        return;
    }

    // 构建 API URL
    const apiUrl = new URL(`https://${API_HOST}/api/${endpoint}`);
    url.searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
            apiUrl.searchParams.append(key, value);
        }
    });

    console.log(`[Proxy] Requesting: ${apiUrl.toString()}`);

    // 获取 API Key（优先使用请求头中的，否则使用默认的）
    const apiKey = req.headers['x-rapidapi-key'] || API_KEY;

    // 发起 HTTPS 请求
    const options = {
        hostname: API_HOST,
        path: apiUrl.pathname + apiUrl.search,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': API_HOST,
            'x-rapidapi-key': apiKey
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            console.log(`[Proxy] Response status: ${proxyRes.statusCode}`);
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
║   http://localhost:${PORT}?endpoint=matches/live            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
