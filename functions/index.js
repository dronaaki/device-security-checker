const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();

// --- Security: Allowed origins for payment redirects ---
const ALLOWED_ORIGINS = [
  'https://unhackme-website-2026.web.app',
  'https://unhackme-website-2026.firebaseapp.com',
  'http://localhost:5173', // dev only — remove before production
];

// --- Security: Per-user rate limiter (Firestore-backed) ---
async function checkRateLimit(uid, action, maxCalls, windowMs) {
  const ref = db.collection('rate_limits').doc(`${uid}_${action}`);
  const snap = await ref.get();
  const now = Date.now();

  if (snap.exists) {
    const data = snap.data();
    if (data.windowStart && (now - data.windowStart) < windowMs) {
      if (data.count >= maxCalls) {
        throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a moment and try again.');
      }
      await ref.update({ count: FieldValue.increment(1) });
    } else {
      await ref.set({ windowStart: now, count: 1 });
    }
  } else {
    await ref.set({ windowStart: now, count: 1 });
  }
}

exports.chatWithAI = onCall({
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

  // Rate limit: max 20 AI calls per minute per user
  await checkRateLimit(request.auth.uid, 'chatWithAI', 20, 60000);

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
    // Security: never leak internal error details to the client
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'The AI service encountered an error. Please try again later.');
  }
});

exports.createCheckoutSession = onCall({
  maxInstances: 10
}, async (request) => {
  // Security (C1): Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to make a purchase.');
  }

  // Security: Validate and restrict redirect origin
  const rawOrigin = request.rawRequest?.headers?.origin;
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : ALLOWED_ORIGINS[0];

  // Rate limit: max 5 checkout sessions per minute per user
  await checkRateLimit(request.auth.uid, 'checkout', 5, 60000);

  try {
    const configDoc = await db.collection("config").doc("payment_provider").get();
    if (!configDoc.exists) {
      throw new HttpsError('failed-precondition', 'Payment is not configured yet. Please contact support.');
    }
    const config = configDoc.data();
    
    if (config.activeProvider !== 'stripe') {
      throw new HttpsError('unimplemented', 'Currently only Stripe is supported for checkout.');
    }

    if (!config.stripeSecretKey) {
      throw new HttpsError('failed-precondition', 'Payment processing is temporarily unavailable.');
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
      // Security: tie checkout to the authenticated user
      client_reference_id: request.auth.uid,
      customer_email: request.auth.token.email || undefined,
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });

    return { url: session.url };
  } catch (err) {
    console.error("Checkout Session Error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Payment processing failed. Please try again later.');
  }
});

