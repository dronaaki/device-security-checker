const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();

// --- Security: Allowed origins for payment redirects ---
const ALLOWED_ORIGINS = [
  'https://unhackme-website-2026.web.app',
  'https://unhackme-website-2026.firebaseapp.com',
  // Only present when running under the Functions emulator — never in a deployed
  // production function — so localhost can't become a valid redirect target there.
  ...(process.env.FUNCTIONS_EMULATOR === 'true' ? ['http://localhost:5173'] : []),
];

// --- Security: Per-user rate limiter (Firestore transaction to prevent races) ---
async function checkRateLimit(uid, action, maxCalls, windowMs) {
  const ref = db.collection('rate_limits').doc(`${uid}_${action}`);
  const now = Date.now();

  await db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);

    if (snap.exists) {
      const data = snap.data();
      if (data.windowStart && (now - data.windowStart) < windowMs) {
        if (data.count >= maxCalls) {
          throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a moment and try again.');
        }
        txn.update(ref, { count: FieldValue.increment(1) });
      } else {
        txn.set(ref, { windowStart: now, count: 1 });
      }
    } else {
      txn.set(ref, { windowStart: now, count: 1 });
    }
  });
}

exports.chatWithAI = onCall({
  maxInstances: 10
}, async (request) => {
  const { testPrompt, testMessages, isTest = false, assistant = 'user' } = request.data || {};

  if (!testPrompt && !testMessages) {
    throw new HttpsError('invalid-argument', 'You must provide a prompt or messages array.');
  }

  // 1. Verify user authentication or handle website assistant
  if (assistant === 'website') {
    // Website support bot allows unauthenticated prospects to ask questions
    const clientIp = request.rawRequest?.ip || request.rawRequest?.headers?.['x-forwarded-for'] || 'anonymous_website';
    await checkRateLimit(String(clientIp), 'websiteChat', 15, 60000);
  } else if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to use the AI Advisor.');
  } else if (assistant === 'admin') {
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const isSuperadmin = request.auth.token?.superadmin === true;
    const userData = userDoc.exists ? userDoc.data() : {};
    const isAdmin = userData.isAdmin === true;
    const notExpired = !userData.accessExpiresAtMillis || Date.now() < userData.accessExpiresAtMillis;
    if (!isSuperadmin && !(isAdmin && notExpired)) {
      throw new HttpsError('permission-denied', 'Admin assistant is restricted to administrators.');
    }
    await checkRateLimit(request.auth.uid, 'chatWithAI', 20, 60000);
  } else {
    // Standard logged in mobile app user
    await checkRateLimit(request.auth.uid, 'chatWithAI', 20, 60000);
  }

  // 2. Securely fetch AI configuration from the right config doc
  let configDocId = 'ai_provider';
  if (assistant === 'admin') configDocId = 'admin_assistant';
  if (assistant === 'website') configDocId = 'website_support_ai';

  let config;
  try {
    const configDoc = await db.collection("config").doc(configDocId).get();
    if (!configDoc.exists) {
      // Fallback default for website if not yet created
      if (assistant === 'website') {
        config = {
          providerId: 'gemini',
          model: 'gemini-1.5-flash',
          systemPrompt: 'You are the Unhackme Website Customer Support AI Assistant. Your goal is to answer questions about Unhackme device security app, provide helpful cybersecurity advice, explain features, and guide visitors to purchase lifetime protection for $29.99.'
        };
      } else {
        throw new HttpsError('failed-precondition', 'AI Configuration not found.');
      }
    } else {
      config = configDoc.data();
    }
  } catch (err) {
    console.error("Error fetching config:", err);
    throw new HttpsError('internal', 'Failed to read AI configuration from database.');
  }

  const providerId = config.providerId || 'ollama';
  const model = config.model || (providerId === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo');
  const apiKey = config.apiKey || '';
  const baseUrl = config.baseUrl || '';
  let systemPrompt = config.systemPrompt || "You are an AI Security Advisor.";

  if (assistant === 'website') {
    // 1. Inject Live Website Frontend Content (Hero, Features, Pricing, Download)
    try {
      const siteContentSnap = await db.collection("website_content").doc("main").get();
      if (siteContentSnap.exists) {
        const sc = siteContentSnap.data();
        let siteText = `\n\n[LIVE WEBSITE FRONTEND CONTENT (VISIBLE ON HOMEPAGE)]\n`;
        if (sc.heroTitle) siteText += `Hero Title: ${sc.heroTitle.replace(/<[^>]*>?/gm, '')}\n`;
        if (sc.heroSubtitle) siteText += `Hero Subtitle: ${sc.heroSubtitle}\n`;
        if (sc.featuresTitle) siteText += `Features Section: ${sc.featuresTitle} - ${sc.featuresSubtitle || ''}\n`;
        if (Array.isArray(sc.features)) {
          sc.features.forEach((f, i) => {
            siteText += `Feature ${i + 1}: ${f.title} - ${f.description}\n`;
          });
        }
        if (sc.downloadTitle) siteText += `Download Info: ${sc.downloadTitle} - ${sc.downloadSubtitle || ''}\n`;
        if (sc.pricingTitle) siteText += `Pricing: ${sc.pricingTitle} - Price: ${sc.pricingPrice || '$29.99'}\n`;
        if (Array.isArray(sc.pricingFeatures)) {
          siteText += `Included in Price: ${sc.pricingFeatures.join(', ')}\n`;
        }
        systemPrompt += siteText;
      }
    } catch (scErr) {
      console.warn("Could not load live website content:", scErr);
    }

    // 2. Inject RAG Knowledge Base Documents (PDFs, Word Docs, URLs, Snippets)
    try {
      const kbSnap = await db.collection("website_knowledge_base").limit(50).get();
      if (!kbSnap.empty) {
        const lastUserMsg = (testMessages && testMessages.length > 0)
          ? testMessages[testMessages.length - 1]?.content || ''
          : (testPrompt || '');
        const queryTerms = lastUserMsg.toLowerCase().split(/\s+/).filter(t => t.length > 3);

        const scoredDocs = [];
        kbSnap.forEach(docSnap => {
          const d = docSnap.data();
          const text = ((d.title || '') + ' ' + (d.content || '') + ' ' + (d.url || '')).toLowerCase();
          let score = 0;
          queryTerms.forEach(term => {
            if (text.includes(term)) score += 1;
          });
          if (queryTerms.length === 0) score = 1;
          scoredDocs.push({ doc: d, score });
        });

        scoredDocs.sort((a, b) => b.score - a.score);
        const topDocs = scoredDocs.slice(0, 5).filter(item => item.score > 0 || queryTerms.length === 0);

        if (topDocs.length > 0) {
          let ragText = `\n\n[RAG KNOWLEDGE BASE DOCUMENTS (PDFs, Word Docs, URLs, Knowledge Base)]\n`;
          topDocs.forEach((item, idx) => {
            const d = item.doc;
            ragText += `Document #${idx + 1} (${d.type || 'DOCUMENT'}: "${d.title || 'Untitled'}"):\n${d.content.slice(0, 1500)}\n\n`;
          });
          systemPrompt += ragText;
        }
      }
    } catch (kbErr) {
      console.warn("Could not load website knowledge base:", kbErr);
    }

    systemPrompt += "\n\nIMPORTANT: Output your response in plain text ONLY. Do NOT use Markdown, bold text, italics, headers, or bullet points. Use standard plain text formatting.";
  }

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
          max_tokens: 1024,
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
    } else if (providerId === 'gemini') {
      // Gemini uses a distinct contract: systemInstruction + contents, role "model"
      // instead of "assistant", and the key goes in the query string, not a header.
      const rawModel = model || 'gemini-1.5-flash';
      const cleanModel = rawModel.replace(/^models\//, '').trim();
      const url = (baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`).replace(/\/+$/, '');

      let geminiSystemText = '';
      const geminiContents = [];
      for (const msg of messages) {
        if (msg.role === 'system') {
          geminiSystemText += msg.content + '\n';
        } else {
          geminiContents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }

      const payload = { contents: geminiContents };
      if (geminiSystemText) {
        payload.systemInstruction = { parts: [{ text: geminiSystemText.trim() }] };
      }

      const res = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
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

  const { planId = 'monthly' } = request.data || {};

  // Plan price configs
  const planConfigs = {
    'monthly': {
      name: 'Unhackme Monthly Plan',
      description: 'Flexible monthly AI protection, threat scanning & app auditing.',
      unit_amount: 999, // $9.99
      recurring: { interval: 'month', interval_count: 1 },
      days: 30
    },
    'semi-annual': {
      name: 'Unhackme Semi-Annual Plan',
      description: '6 Months of AI updates, protection for up to 3 devices, and 24/7 priority support.',
      unit_amount: 4999, // $49.99
      recurring: { interval: 'month', interval_count: 6 },
      days: 180
    },
    'yearly': {
      name: 'Unhackme Yearly Best Value Plan',
      description: 'Full 1-Year AI protection, priority neural updates, and VIP 24/7 support.',
      unit_amount: 8999, // $89.99
      recurring: { interval: 'year', interval_count: 1 },
      days: 365
    }
  };

  const selectedPlan = planConfigs[planId] || planConfigs['monthly'];

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
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.unit_amount,
            recurring: selectedPlan.recurring,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        planId: planId,
        days: String(selectedPlan.days),
      },
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

// --- Stripe webhook: this is what actually grants the purchase. ---
exports.stripeWebhook = onRequest(
  { maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    let config;
    try {
      const configDoc = await db.collection("config").doc("payment_provider").get();
      if (!configDoc.exists) {
        console.error("stripeWebhook: payment_provider config not found");
        res.status(500).send("Payment not configured");
        return;
      }
      config = configDoc.data();
    } catch (err) {
      console.error("stripeWebhook: failed to load config", err);
      res.status(500).send("Config error");
      return;
    }

    if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
      console.error("stripeWebhook: missing stripeSecretKey or stripeWebhookSecret");
      res.status(500).send("Payment not fully configured");
      return;
    }

    const stripe = require("stripe")(config.stripeSecretKey);

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        config.stripeWebhookSecret
      );
    } catch (err) {
      console.error("stripeWebhook: signature verification failed", err.message);
      res.status(400).send(`Webhook signature verification failed`);
      return;
    }

    try {
      if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created") {
        const session = event.data.object;
        const uid = session.client_reference_id;

        if (!uid) {
          console.error("stripeWebhook: event with no client_reference_id", session.id);
        } else {
          const planId = session.metadata?.planId || 'monthly';
          let durationDays = Number(session.metadata?.days || 30);
          if (planId === 'semi-annual') durationDays = 180;
          if (planId === 'yearly') durationDays = 365;

          const accessExpiresAtMillis = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

          await db.collection("users").doc(uid).set(
            {
              isPaid: true,
              plan: planId,
              accessExpiresAtMillis: accessExpiresAtMillis,
              paidAt: FieldValue.serverTimestamp(),
              lastStripeSessionId: session.id,
            },
            { merge: true }
          );

          await db.collection("transactions").add({
            uid,
            provider: "stripe",
            sessionId: session.id,
            amount: session.amount_total || session.unit_amount || 0,
            currency: session.currency || "usd",
            status: "success",
            plan: planId,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("stripeWebhook: failed to process event", err);
      res.status(500).send("Internal error processing webhook");
    }
  }
);

