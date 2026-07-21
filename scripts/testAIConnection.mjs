import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsvx2xcsaJ1pL0xtnbZS0fXWc0Y4SYDCg",
  authDomain: "device-sec-checker-2026.firebaseapp.com",
  projectId: "device-sec-checker-2026",
  storageBucket: "device-sec-checker-2026.firebasestorage.app",
  messagingSenderId: "823856949464",
  appId: "1:823856949464:web:d9c6001561c243e8144fad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTest() {
  console.log("Fetching AI configuration from Firestore...");
  const configDoc = await getDoc(doc(db, 'config', 'ai_provider'));
  
  if (!configDoc.exists()) {
    console.error("No AI configuration found in Firestore.");
    process.exit(1);
  }

  const data = configDoc.data();
  const providerId = data.providerId || 'ollama';
  const model = data.model || (providerId === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo');
  const apiKey = data.apiKey;
  const baseUrl = data.baseUrl;
  const systemPrompt = data.systemPrompt || "You are a test AI.";

  console.log(`Provider: ${providerId}`);
  console.log(`Model: ${model}`);
  console.log(`API Key set: ${!!apiKey}`);

  const testPrompt = "Hello! Please reply with a short confirmation that you are working.";

  try {
    let responseText = '';
    console.log("Sending test request...");

    if (providerId === 'anthropic') {
      const url = (baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
      const res = await fetch(`${url}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 250,
          system: systemPrompt,
          messages: [{ role: 'user', content: testPrompt }]
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      responseText = resData?.content?.[0]?.text || JSON.stringify(resData);
    } else if (providerId === 'ollama') {
      const url = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testPrompt }
          ]
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      responseText = resData?.message?.content || JSON.stringify(resData);
    } else {
      const url = (baseUrl || (providerId === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')).replace(/\/+$/, '');
      const res = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testPrompt }
          ]
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      responseText = resData?.choices?.[0]?.message?.content || JSON.stringify(resData);
    }

    console.log("\n--- AI RESPONSE ---");
    console.log(responseText);
    console.log("-------------------");
    console.log("\nThe AI is working successfully!");

  } catch (err) {
    console.error("\nFailed to connect to the AI Provider.");
    console.error(err.message || err.toString());
  }

  process.exit(0);
}

runTest().catch(console.error);
