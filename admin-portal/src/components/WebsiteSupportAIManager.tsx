import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { Bot, Save, MessageSquare, Sparkles, Send, RefreshCw, Sliders, ShieldCheck, Globe, Upload, Trash2, Database } from 'lucide-react';
import { db } from '../firebase';

export interface KBDocument {
  id?: string;
  title: string;
  type: 'pdf' | 'docx' | 'url' | 'text';
  content: string;
  url?: string;
  charCount: number;
  createdAt: string;
}

export function WebsiteSupportAIManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AI Model Config
  const [providerId, setProviderId] = useState('gemini');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  // Default sales & support system prompt
  const defaultPrompt = `You are the official Unhackme Website Customer Support & AI Security Advisor.
Your mission is to welcome prospects to the Unhackme website, answer their questions about device security, malware, privacy, and app auditing, and expertly guide them toward purchasing Unhackme ($29.99 lifetime protection).

KEY KNOWLEDGE & VALUE PROPOSITIONS:
1. What is Unhackme? Unhackme is an advanced AI-powered device security checker for mobile (iOS/Android) and desktop.
2. Core Features: Real-time neural threat scanning, stealth app auditing (microphone/camera access checks), network anomaly detection, zero-day exploit prevention.
3. Pricing & Guarantee: One-time payment of $29.99 for lifetime access and updates. No recurring subscriptions or hidden monthly fees. Protection for up to 3 devices.
4. Privacy First: All scanning is done locally on-device or anonymously. User data and browsing logs are NEVER tracked or sold.

COMMUNICATION RULES:
- Be warm, helpful, professional, and convincing.
- Provide direct security advice when asked about malware, hack signs, or phone safety.
- Utilize both live frontend website content and uploaded RAG Knowledge Base documents to answer detailed questions accurately.
- Gently highlight how Unhackme solves user concerns and recommend clicking the "Get Protection" button to purchase lifetime security.
- ALWAYS respond in plain text ONLY. Do NOT use Markdown formatting, asterisks, bullet points, headers, or bold text.`;

  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);

  // Widget Customization Settings
  const [botName, setBotName] = useState('Unhackme Support AI');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! 👋 Wondering if your device is secure? Ask me anything or let me help you protect your phone!');
  const [autoOpenDelay, setAutoOpenDelay] = useState(3);
  const [ctaText, setCtaText] = useState('Get Lifetime Protection ($29.99)');

  // RAG Knowledge Base State
  const [kbDocs, setKbDocs] = useState<KBDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'manual'>('upload');
  
  // RAG Ingestion Form States
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadType, setUploadType] = useState<'pdf' | 'docx' | 'text'>('text');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlScrapedContent, setUrlScrapedContent] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Test Sandbox State
  const [testMessage, setTestMessage] = useState('Is my phone vulnerable to spy apps?');
  const [testChatHistory, setTestChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load website support AI config
        const docRef = doc(db, 'config', 'website_support_ai');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.providerId) setProviderId(data.providerId);
          if (data.model) setModel(data.model);
          if (data.apiKey) setApiKey(data.apiKey);
          if (data.baseUrl) setBaseUrl(data.baseUrl);
          if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
          if (data.botName) setBotName(data.botName);
          if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
          if (data.autoOpenDelay !== undefined) setAutoOpenDelay(data.autoOpenDelay);
          if (data.ctaText) setCtaText(data.ctaText);
        }

        // 2. Load RAG Knowledge Base documents
        const kbSnap = await getDocs(collection(db, 'website_knowledge_base'));
        const docsList: KBDocument[] = [];
        kbSnap.forEach(d => {
          docsList.push({ id: d.id, ...d.data() } as KBDocument);
        });
        setKbDocs(docsList);

      } catch (err) {
        console.error('Failed to load website support AI config / RAG docs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'website_support_ai'), {
        providerId,
        model,
        apiKey,
        baseUrl,
        systemPrompt,
        botName,
        welcomeMessage,
        autoOpenDelay: Number(autoOpenDelay),
        ctaText,
        updatedAt: new Date().toISOString(),
      });
      alert('Website Support AI configuration saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save website support AI settings.');
    } finally {
      setSaving(false);
    }
  };

  // --- File Processing (PDF, DOCX, TXT, MD) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileName = file.name;
    setUploadTitle(fileName.replace(/\.[^/.]+$/, ''));

    let extension = fileName.split('.').pop()?.toLowerCase() || 'text';
    let fileType: 'pdf' | 'docx' | 'text' = 'text';
    if (extension === 'pdf') fileType = 'pdf';
    if (extension === 'docx' || extension === 'doc') fileType = 'docx';
    setUploadType(fileType);

    try {
      if (fileType === 'text') {
        const text = await file.text();
        setUploadContent(text);
      } else {
        // Read file as binary/text string and extract printable text characters
        const reader = new FileReader();
        reader.onload = (event) => {
          const rawResult = event.target?.result as string;
          if (rawResult) {
            // Strip control characters & non-printable binary junk, preserving readable sentences
            const cleanText = rawResult
              .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            setUploadContent(cleanText.slice(0, 50000));
          }
          setIsProcessingFile(false);
        };
        reader.readAsText(file);
        return;
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert('Could not parse file text. Please try a .txt, .pdf, or .docx file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveUploadedDoc = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) {
      alert('Please provide a title and document content.');
      return;
    }

    try {
      const newDoc: KBDocument = {
        title: uploadTitle.trim(),
        type: uploadType,
        content: uploadContent.trim(),
        charCount: uploadContent.trim().length,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, 'website_knowledge_base'), newDoc);
      setKbDocs(prev => [{ id: ref.id, ...newDoc }, ...prev]);
      setUploadTitle('');
      setUploadContent('');
      alert('Document added to RAG Knowledge Base!');
    } catch (err) {
      console.error(err);
      alert('Failed to save document to RAG Knowledge Base.');
    }
  };

  // --- URL Scraping Ingest ---
  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;
    setIsScrapingUrl(true);
    try {
      let targetUrl = urlInput.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      const res = await fetch('http://localhost:3001/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UnhackmeBot/1.0' },
          body: null
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawHtml = await res.text();

      // Strip HTML tags, scripts, and styles to leave clean readable text
      const cleanText = rawHtml
        .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      setUrlScrapedContent(cleanText.slice(0, 30000));
      if (!urlTitle.trim()) {
        try {
          const parsed = new URL(targetUrl);
          setUrlTitle(parsed.hostname + parsed.pathname);
        } catch {
          setUrlTitle(targetUrl);
        }
      }
    } catch (err: any) {
      console.error('URL scraping failed:', err);
      alert(`Could not scrape URL: ${err.message || 'Network error'}. Check proxy or target URL.`);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSaveUrlDoc = async () => {
    if (!urlTitle.trim() || !urlScrapedContent.trim()) {
      alert('Please scrape or enter content from a URL before saving.');
      return;
    }

    try {
      const newDoc: KBDocument = {
        title: urlTitle.trim(),
        type: 'url',
        url: urlInput.trim(),
        content: urlScrapedContent.trim(),
        charCount: urlScrapedContent.trim().length,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, 'website_knowledge_base'), newDoc);
      setKbDocs(prev => [{ id: ref.id, ...newDoc }, ...prev]);
      setUrlInput('');
      setUrlTitle('');
      setUrlScrapedContent('');
      alert('URL Document added to RAG Knowledge Base!');
    } catch (err) {
      console.error(err);
      alert('Failed to save URL document.');
    }
  };

  // --- Manual Text Snippet Ingest ---
  const handleSaveManualDoc = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      alert('Please provide a title and snippet text.');
      return;
    }

    try {
      const newDoc: KBDocument = {
        title: manualTitle.trim(),
        type: 'text',
        content: manualContent.trim(),
        charCount: manualContent.trim().length,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, 'website_knowledge_base'), newDoc);
      setKbDocs(prev => [{ id: ref.id, ...newDoc }, ...prev]);
      setManualTitle('');
      setManualContent('');
      alert('Knowledge Snippet added to RAG Knowledge Base!');
    } catch (err) {
      console.error(err);
      alert('Failed to save snippet.');
    }
  };

  // --- Delete Document ---
  const handleDeleteDoc = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this document from the RAG Knowledge Base?')) return;
    try {
      await deleteDoc(doc(db, 'website_knowledge_base', id));
      setKbDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    }
  };

  const formatAIResponse = (prov: string, data: any) => {
    if (!data) return 'No response returned';
    if (prov === 'anthropic') return data?.content?.[0]?.text || JSON.stringify(data);
    if (prov === 'ollama') return data?.message?.content || JSON.stringify(data);
    if (prov === 'gemini') return data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    return data?.choices?.[0]?.message?.content || JSON.stringify(data);
  };

  const handleTestChat = async () => {
    if (!testMessage.trim()) return;
    const userMsg = testMessage;
    setTestMessage('');
    const newHistory = [...testChatHistory, { role: 'user', content: userMsg }];
    setTestChatHistory(newHistory);
    setIsTesting(true);

    try {
      let targetUrl = 'https://api.openai.com/v1/chat/completions';
      if (providerId === 'openrouter') targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
      if (providerId === 'groq') targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
      if (providerId === 'mistral') targetUrl = 'https://api.mistral.ai/v1/chat/completions';
      if (providerId === 'anthropic') targetUrl = 'https://api.anthropic.com/v1/messages';
      if (providerId === 'ollama') targetUrl = `${baseUrl || 'http://localhost:11434'}/api/chat`;
      if (providerId === 'gemini') {
        const cleanModel = (model || 'gemini-1.5-flash').replace(/^models\//, '').trim();
        targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
      } else if (baseUrl) {
        targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      }

      // Build RAG System Prompt for Test Sandbox
      let finalPrompt = systemPrompt;
      if (kbDocs.length > 0) {
        finalPrompt += `\n\n[RAG KNOWLEDGE BASE DOCUMENTS (PDFs, DOCX, URLs)]\n`;
        kbDocs.slice(0, 5).forEach((d, idx) => {
          finalPrompt += `Document #${idx + 1} (${d.type.toUpperCase()}: "${d.title}"):\n${d.content.slice(0, 1200)}\n\n`;
        });
      }
      finalPrompt += "\n\nIMPORTANT: Output your response in plain text ONLY. Do NOT use Markdown, bold text, italics, headers, or bullet points.";

      let bodyPayload: any = {};
      let customHeaders: any = { 'Content-Type': 'application/json' };

      if (providerId === 'anthropic') {
        customHeaders['anthropic-version'] = '2023-06-01';
        customHeaders['x-api-key'] = apiKey;
        bodyPayload = {
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: finalPrompt,
          messages: newHistory,
        };
      } else if (providerId === 'ollama') {
        bodyPayload = {
          model: model || 'llama3.2:3b',
          stream: false,
          messages: [{ role: 'system', content: finalPrompt }, ...newHistory],
        };
      } else if (providerId === 'gemini') {
        bodyPayload = {
          contents: newHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          systemInstruction: { parts: [{ text: finalPrompt }] },
        };
      } else {
        if (apiKey) customHeaders['Authorization'] = `Bearer ${apiKey}`;
        bodyPayload = {
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: finalPrompt }, ...newHistory],
          max_tokens: 1024,
        };
      }

      const res = await fetch('http://localhost:3001/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          headers: customHeaders,
          body: bodyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      const answer = formatAIResponse(providerId, data);
      setTestChatHistory([...newHistory, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('Test chat error:', err);
      setTestChatHistory([...newHistory, { role: 'assistant', content: `Error: ${err.message || 'Failed to connect to AI provider.'}` }]);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading Website Support AI & RAG Manager...</div>;
  }

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bot color="#3b82f6" size={32} />
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Website Customer Support AI & RAG Manager</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Configure AI model settings, sales persona, and upload PDF/Word/URL documents for RAG context retrieval.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: AI Config, Persona, Widget Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Provider & Credentials */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Sliders size={18} color="#60a5fa" /> AI Model & Engine Config
              </h3>

              <div>
                <label className="input-label">AI Provider</label>
                <select 
                  value={providerId} 
                  onChange={e => setProviderId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-3.5)</option>
                  <option value="openrouter">OpenRouter (Multi-model)</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek AI</option>
                  <option value="groq">Groq Llama 3</option>
                  <option value="mistral">Mistral AI</option>
                  <option value="ollama">Local Ollama</option>
                  <option value="qwen">Alibaba Qwen</option>
                  <option value="zhipu">Zhipu GLM-4</option>
                  <option value="moonshot">Moonshot AI</option>
                  <option value="baichuan">Baichuan AI</option>
                  <option value="yi">01.AI (Yi)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Model Name / ID</label>
                <input 
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash, gpt-4o, claude-3-haiku-20240307"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="input-label">API Key</label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter API Key"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="input-label">Base URL (Optional override)</label>
                <input 
                  type="text"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="Leave blank for default API URL"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Sales Persona & System Prompt */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Sparkles size={18} color="#a855f7" /> Sales Persona & Knowledge Prompt
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Define the personality, security advice rules, and purchase conversion guidelines for the website bot.
              </p>
              <textarea 
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={9}
                className="input-field"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
              />
              <button 
                type="button" 
                onClick={() => setSystemPrompt(defaultPrompt)} 
                style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'right' }}
              >
                Reset to Default Sales Prompt
              </button>
            </div>

            {/* Widget Settings */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <MessageSquare size={18} color="#10b981" /> Website Chat Widget Customization
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Bot Title / Display Name</label>
                  <input 
                    type="text" 
                    value={botName} 
                    onChange={e => setBotName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="input-label">Popup Delay (seconds)</label>
                  <input 
                    type="number" 
                    value={autoOpenDelay} 
                    onChange={e => setAutoOpenDelay(Number(e.target.value))}
                    min={0}
                    max={60}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Welcome Greeting Message</label>
                <textarea 
                  value={welcomeMessage} 
                  onChange={e => setWelcomeMessage(e.target.value)}
                  rows={2}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="input-label">Purchase Button CTA Text</label>
                <input 
                  type="text" 
                  value={ctaText} 
                  onChange={e => setCtaText(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="btn"
              style={{ 
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
                color: 'white', 
                padding: '0.85rem 1.5rem', 
                fontSize: '1rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '8px'
              }}
            >
              <Save size={20} />
              {saving ? 'Saving Configuration...' : 'Save AI Configuration'}
            </button>
          </form>

        </div>

        {/* Right Column: RAG Knowledge Base Ingestion & Live Test Sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* RAG Knowledge Base Ingestion Section */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={22} color="#ec4899" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>RAG Knowledge Base Ingestion</h3>
              </div>
              <span style={{ fontSize: '0.8rem', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600 }}>
                {kbDocs.length} Documents Active
              </span>
            </div>

            {/* Ingestion Type Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '8px' }}>
              <button 
                type="button" 
                onClick={() => setActiveTab('upload')}
                style={{ 
                  flex: 1, 
                  padding: '0.4rem 0.75rem', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: activeTab === 'upload' ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === 'upload' ? 'white' : 'var(--text-muted)'
                }}
              >
                📁 Upload File (PDF/DOCX/TXT)
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('url')}
                style={{ 
                  flex: 1, 
                  padding: '0.4rem 0.75rem', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: activeTab === 'url' ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === 'url' ? 'white' : 'var(--text-muted)'
                }}
              >
                🌐 Ingest Website URL
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('manual')}
                style={{ 
                  flex: 1, 
                  padding: '0.4rem 0.75rem', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: activeTab === 'manual' ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === 'manual' ? 'white' : 'var(--text-muted)'
                }}
              >
                ✍️ Text Snippet
              </button>
            </div>

            {/* Tab 1: File Upload (PDF/DOCX/TXT/MD) */}
            {activeTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.15)' }}>
                  <Upload size={32} color="#60a5fa" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Upload a <strong>PDF, Word (.docx), or Text (.txt, .md)</strong> document
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.doc,.txt,.md,.json,.csv" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                    id="kbFileInput"
                  />
                  <label 
                    htmlFor="kbFileInput" 
                    className="btn"
                    style={{ background: 'var(--accent-color)', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer', display: 'inline-block', fontSize: '0.85rem' }}
                  >
                    Select Document File
                  </label>
                  {isProcessingFile && <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.5rem' }}>Extracting text...</div>}
                </div>

                {uploadContent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label className="input-label">Document Title</label>
                      <input 
                        type="text" 
                        value={uploadTitle} 
                        onChange={e => setUploadTitle(e.target.value)}
                        className="input-field" 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">Extracted Text Preview ({uploadContent.length} chars)</label>
                      <textarea 
                        value={uploadContent} 
                        onChange={e => setUploadContent(e.target.value)}
                        rows={4}
                        className="input-field"
                        style={{ width: '100%', fontSize: '0.8rem', fontFamily: 'monospace' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSaveUploadedDoc}
                      className="btn" 
                      style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem' }}
                    >
                      Save Document to RAG Knowledge Base
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: URL Scraper & Ingester */}
            {activeTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="Enter target website or web doc URL (e.g. example.com/docs)"
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    onClick={handleScrapeUrl}
                    disabled={isScrapingUrl || !urlInput.trim()}
                    className="btn"
                    style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Globe size={16} /> {isScrapingUrl ? 'Scraping...' : 'Fetch URL'}
                  </button>
                </div>

                {urlScrapedContent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label className="input-label">URL Document Title</label>
                      <input 
                        type="text" 
                        value={urlTitle} 
                        onChange={e => setUrlTitle(e.target.value)}
                        className="input-field" 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">Parsed Content Preview ({urlScrapedContent.length} chars)</label>
                      <textarea 
                        value={urlScrapedContent} 
                        onChange={e => setUrlScrapedContent(e.target.value)}
                        rows={4}
                        className="input-field"
                        style={{ width: '100%', fontSize: '0.8rem', fontFamily: 'monospace' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSaveUrlDoc}
                      className="btn" 
                      style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem' }}
                    >
                      Save URL Document to RAG Knowledge Base
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Manual Text Snippet */}
            {activeTab === 'manual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Snippet Title</label>
                  <input 
                    type="text" 
                    value={manualTitle} 
                    onChange={e => setManualTitle(e.target.value)}
                    placeholder="e.g. Refund Policy & Lifetime Updates"
                    className="input-field" 
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="input-label">Knowledge Content / Policy Text</label>
                  <textarea 
                    value={manualContent} 
                    onChange={e => setManualContent(e.target.value)}
                    rows={4}
                    placeholder="Type or paste custom technical specs, Q&A pairs, or policy details..."
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleSaveManualDoc}
                  className="btn" 
                  style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem' }}
                >
                  Save Snippet to RAG Knowledge Base
                </button>
              </div>
            )}

            {/* Active Ingested Document List */}
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ingested Documents List ({kbDocs.length})
              </div>
              {kbDocs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No documents ingested yet. Upload PDFs, Word docs, URLs, or text snippets above.
                </div>
              ) : (
                kbDocs.map(d => (
                  <div 
                    key={d.id} 
                    style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      border: '1px solid var(--border-color)', 
                      padding: '0.6rem 0.8rem', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        background: d.type === 'pdf' ? 'rgba(239, 68, 68, 0.2)' : d.type === 'url' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: d.type === 'pdf' ? '#f87171' : d.type === 'url' ? '#60a5fa' : '#34d399'
                      }}>
                        {d.type}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.charCount} characters
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteDoc(d.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove Document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Interactive Live Test Sandbox */}
          <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>RAG Sandbox Test</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setTestChatHistory([])}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} /> Clear
              </button>
            </div>

            {/* Chat Messages Log */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ alignSelf: 'flex-start', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 2px', maxWidth: '85%' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {welcomeMessage}
                </p>
              </div>

              {testChatHistory.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    border: msg.role === 'user' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-color)',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    maxWidth: '85%'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {msg.content}
                  </p>
                </div>
              ))}

              {isTesting && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Searching RAG knowledge base & generating plain-text response...
                </div>
              )}
            </div>

            {/* Input & Send */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleTestChat())}
                placeholder="Ask about uploaded docs or website features..."
                className="input-field"
                style={{ flex: 1 }}
              />
              <button 
                type="button"
                onClick={handleTestChat}
                disabled={isTesting || !testMessage.trim()}
                className="btn"
                style={{ background: 'var(--accent-color)', color: 'white', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Send size={16} /> Send
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
