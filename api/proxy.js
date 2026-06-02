// Vercel Serverless Function - API Proxy
// 解决浏览器 CORS 限制

const https = require('https');

module.exports = async (req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-rapidapi-host, x-rapidapi-key');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 获取请求参数
    const { endpoint, ...params } = req.query;

    if (!endpoint) {
        return res.status(400).json({
            error: 'Missing endpoint parameter',
            usage: '/api/proxy?endpoint=football-players-search&search=manchester'
        });
    }

    // 构建 API URL
    const apiUrl = new URL(`https://free-api-live-football-data.p.rapidapi.com/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, value);
    });

    // API 配置
    const apiKey = req.headers['x-rapidapi-key'] || '3578074cb7msh73f3a9e20e60e06p1fe94fjsnc36c0746bd2e';
    const apiHost = 'free-api-live-football-data.p.rapidapi.com';

    try {
        // 发起请求
        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': apiHost,
                'x-rapidapi-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 返回数据
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Failed to fetch from API',
            message: error.message
        });
    }
};
