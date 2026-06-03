// Vercel Serverless Function - API Proxy
// 解决浏览器 CORS 限制

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
            usage: '/api/proxy?endpoint=matches/live'
        });
    }

    // 构建 API URL
    const apiHost = 'footapi7.p.rapidapi.com';
    const apiUrl = new URL(`https://${apiHost}/api/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, value);
    });

    // API 配置 - 优先使用请求头中的 Key，否则使用环境变量
    const apiKey = req.headers['x-rapidapi-key'] || process.env.RAPIDAPI_KEY || '';

    console.log(`[Proxy] Requesting: ${apiUrl.toString()}`);

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

        console.log(`[Proxy] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Proxy] API Error: ${response.status} - ${errorText}`);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 返回数据
        res.status(200).json(data);
    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch from API',
            message: error.message,
            endpoint: endpoint,
            apiUrl: apiUrl.toString()
        });
    }
};
