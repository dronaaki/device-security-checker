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

exports.createCheckoutSession = onCall({
  cors: true,
  maxInstances: 10
}, async (request) => {
  const origin = request.rawRequest?.headers?.origin || "http://localhost:5173";
  
  try {
    const configDoc = await db.collection("config").doc("payment_provider").get();
    if (!configDoc.exists) {
      throw new HttpsError('failed-precondition', 'Payment configuration not found.');
    }
    const config = configDoc.data();
    
    if (config.activeProvider !== 'stripe') {
      throw new HttpsError('unimplemented', 'Currently only Stripe is supported for checkout.');
    }

    if (!config.stripeSecretKey) {
      throw new HttpsError('failed-precondition', 'Stripe Secret Key is missing in configuration.');
    }

    const stripe = require('stripe')(config.stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'apple_pay', 'google_pay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Unhackme Lifetime Plan',
              description: 'Lifetime AI updates, protection for 3 devices, and 24/7 priority support.',
            },
            unit_amount: 2999, // $29.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });

    return { url: session.url };
  } catch (err) {
    console.error("Checkout Session Error:", err);
    throw new HttpsError('internal', err.message || err.toString());
  }
});

