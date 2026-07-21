import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Allowlist of known AI provider domains to prevent SSRF
const ALLOWED_DOMAINS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.mistral.ai',
  'api.deepseek.com',
  'dashscope.aliyuncs.com',
  'open.bigmodel.cn',
  'api.moonshot.cn',
  'api.baichuan-ai.com',
  'api.01.ai',
  'openrouter.ai',
  'router.huggingface.co',
  'localhost',
  '127.0.0.1',
];

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

app.post('/proxy', async (req, res) => {
  try {
    const { url, headers, body } = req.body;

    if (!isAllowedUrl(url)) {
      return res.status(403).json({ error: `Domain not allowed. Only known AI provider domains are permitted.` });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    console.log(`[Proxy] POST ${url} - Status: ${response.status}`);
    if (!response.ok) {
      console.log(`[Proxy Error]`, data);
      return res.status(response.status).json(data);
    }
    console.log(`[Proxy Success]`, JSON.stringify(data).substring(0, 200) + '...');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Local AI Proxy Server is running at http://localhost:${PORT}`);
  console.log(`Leave this terminal open while you test the AI in your browser!\n`);
});
