import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    const { url, headers, body } = req.body;
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
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
