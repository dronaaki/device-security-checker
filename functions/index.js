const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = getFirestore();

exports.chatWithAI = onCall({
  cors: true,
  maxInstances: 10
}, async (request) => {
  // 1. Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to use the AI Advisor.');
  }

  const { testPrompt, testMessages, isTest = false } = request.data;
  
  if (!testPrompt && !testMessages) {
    throw new HttpsError('invalid-argument', 'You must provide a prompt or messages array.');
  }

  // 2. Securely fetch AI configuration
  let config;
  try {
    const configDoc = await db.collection("config").doc("ai_provider").get();
    if (!configDoc.exists) {
      throw new HttpsError('failed-precondition', 'AI Configuration not found.');
    }
    config = configDoc.data();
  } catch (err) {
    console.error("Error fetching config:", err);
    throw new HttpsError('internal', 'Failed to read AI configuration from database.');
  }

  const providerId = config.providerId || 'ollama';
  const model = config.model || (providerId === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo');
  const apiKey = config.apiKey || '';
  const baseUrl = config.baseUrl || '';
  let systemPrompt = config.systemPrompt || "You are an AI Security Advisor embedded in a mobile device security app.";

  // If this is not a simple test from the dashboard, it usually contains historical context.
  if (!isTest && request.data.logSummary) {
    systemPrompt += `\n\nHere is the user's recent threat history from automated device scans:\n${request.data.logSummary}`;
  }

  const messages = testMessages || [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: testPrompt }
  ];

  if (providerId === 'anthropic' && messages[0]?.role === 'system') {
    // Anthropic uses a top-level system parameter, not a message
    systemPrompt = messages.shift().content;
  }

  try {
    let responseText = '';

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
          messages: messages
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      responseText = data?.content?.[0]?.text || JSON.stringify(data);
    } else if (providerId === 'ollama') {
      const url = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          stream: false,
          messages: messages
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      responseText = data?.message?.content || JSON.stringify(data);
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
          messages: messages
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      responseText = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    }

    return { text: responseText };

  } catch (err) {
    console.error("AI API Error:", err);
    throw new HttpsError('internal', err.message || err.toString());
  }
});
