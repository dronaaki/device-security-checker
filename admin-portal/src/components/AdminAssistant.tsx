import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Send, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../firebase';

interface AdminAssistantProps {
  subscribers: any[];
  incidents: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AdminAssistant({ subscribers, incidents }: AdminAssistantProps) {
  // Settings State
  const [providerId, setProviderId] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am your Admin AI Assistant. Ask me anything about the backend, your subscribers, or system incidents." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'admin_assistant'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setProviderId(data.providerId || 'openai');
          setApiKey(data.apiKey || '');
          setModel(data.model || '');
          setBaseUrl(data.baseUrl || '');
        }
      } catch (err) {
        console.error("Failed to load admin AI config", err);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'admin_assistant'), {
        providerId,
        apiKey,
        model,
        baseUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setShowSettings(false);
      alert("Admin Assistant configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save config.");
    } finally {
      setSaving(false);
    }
  };

  const fetchAI = async (promptText: string, contextMessage: string) => {
    let targetUrl = '';
    if (providerId === 'anthropic') {
      targetUrl = (baseUrl || 'https://api.anthropic.com/v1/messages').replace(/\/+$/, '');
    } else if (providerId === 'ollama') {
      targetUrl = (baseUrl || 'http://localhost:11434/api/chat').replace(/\/+$/, '');
    } else if (providerId === 'gemini') {
      const cleanModel = (model || 'gemini-1.5-flash').replace(/^models\//, '').trim();
      targetUrl = (baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`).replace(/\/+$/, '');
    } else {
      targetUrl = (baseUrl || 'https://api.openai.com/v1/chat/completions').replace(/\/+$/, '');
    }

    let bodyPayload: any = {};
    let customHeaders: any = { 'Content-Type': 'application/json' };

    if (providerId === 'anthropic') {
      customHeaders['anthropic-version'] = '2023-06-01';
      customHeaders['x-api-key'] = apiKey;
      bodyPayload = {
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: contextMessage,
        messages: [...messages, { role: 'user', content: promptText }]
      };
    } else if (providerId === 'ollama') {
      bodyPayload = {
        model: model || 'llama3.2:3b',
        stream: false,
        messages: [
          { role: 'system', content: contextMessage },
          ...messages,
          { role: 'user', content: promptText }
        ]
      };
    } else if (providerId === 'gemini') {
      const formattedHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      bodyPayload = {
        contents: [...formattedHistory, { role: 'user', parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: contextMessage }] }
      };
    } else {
      if (apiKey) customHeaders['Authorization'] = `Bearer ${apiKey}`;
      bodyPayload = {
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: contextMessage },
          ...messages,
          { role: 'user', content: promptText }
        ]
      };
    }

    const res = await fetch('http://localhost:3001/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        headers: customHeaders,
        body: bodyPayload
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }
    const data = await res.json();
    
    if (providerId === 'anthropic') return data?.content?.[0]?.text;
    if (providerId === 'ollama') return data?.message?.content;
    if (providerId === 'gemini') return data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return data?.choices?.[0]?.message?.content;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Build dynamic context string based on props
      const contextMessage = `
You are the Admin AI Assistant for a Device Security Checker platform.
You have real-time access to the backend data. 
Here is a snapshot of the current state:

TOTAL SUBSCRIBERS: ${subscribers.length}
SUBSCRIBER DATA (SAMPLE):
${JSON.stringify(subscribers.slice(0, 5), null, 2)}

RECENT AI INCIDENTS (LAST 10):
${JSON.stringify(incidents.slice(0, 10), null, 2)}

Use this data to answer the admin's questions accurately. If they ask about trends, summarize the provided data.
Keep your answers concise, professional, and helpful.
      `.trim();

      const responseText = await fetchAI(userMessage, contextMessage);
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText || "I couldn't generate a response." }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot color="#3b82f6" size={24} />
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Admin Backend Assistant</h3>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Settings size={16} /> 
          {showSettings ? 'Hide Settings' : 'Settings'}
          {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showSettings && (
        <form onSubmit={handleSaveConfig} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Provider</label>
              <select className="input-field" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>
            <div>
              <label className="input-label">API Key</label>
              <input type="password" className="input-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            </div>
            <div>
              <label className="input-label">Model (Optional)</label>
              <input type="text" className="input-field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Leave blank for default" />
            </div>
            <div>
              <label className="input-label">Base URL (Optional)</label>
              <input type="text" className="input-field" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <button type="submit" className="btn" disabled={saving} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            <Save size={16} style={{ marginRight: '0.5rem' }} /> {saving ? 'Saving...' : 'Save AI Config'}
          </button>
        </form>
      )}

      {/* Chat History */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' 
          }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              backgroundColor: msg.role === 'user' ? 'var(--accent-color)' : '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </div>
            <div style={{
              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              color: msg.role === 'user' ? 'white' : 'var(--text-color)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              borderTopRightRadius: msg.role === 'user' ? '0' : '12px',
              borderTopLeftRadius: msg.role === 'assistant' ? '0' : '12px',
              maxWidth: '80%',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderTopLeftRadius: 0, color: 'var(--text-muted)' }}>
              Assistant is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Ask about subscribers, backend metrics, or incidents..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping || (!apiKey && providerId !== 'ollama')}
          style={{ flex: 1, margin: 0 }}
        />
        <button type="submit" className="btn" disabled={isTyping || !input.trim() || (!apiKey && providerId !== 'ollama')} style={{ padding: '0 1.25rem' }}>
          <Send size={18} />
        </button>
      </form>
      {(!apiKey && providerId !== 'ollama') && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
          Please configure your API key in Settings to use the assistant.
        </p>
      )}
    </div>
  );
}
