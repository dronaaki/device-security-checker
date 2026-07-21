import React, { useState, useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Send, Bot, User } from 'lucide-react';
import { functions } from '../firebase';

interface AdminAssistantProps {
  subscribers: any[];
  incidents: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AdminAssistant({ subscribers, incidents }: AdminAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I am your Admin AI Assistant. Ask me anything about the backend, your subscribers, or system incidents." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Redact PII before sending to third-party AI providers.
      const redactedSubscribers = subscribers.slice(0, 5).map((s, i) => ({
        anonId: `subscriber_${i + 1}`,
        isAdmin: !!s.isAdmin,
        role: s.role,
        isPaid: !!s.isPaid,
        plan: s.plan,
        createdAt: s.createdAt,
      }));

      const contextMessage = `
You are the Admin AI Assistant for a Device Security Checker platform.
You have real-time access to the backend data.
Here is a snapshot of the current state:

TOTAL SUBSCRIBERS: ${subscribers.length}
SUBSCRIBER DATA (SAMPLE, ANONYMIZED — no names/emails/IDs):
${JSON.stringify(redactedSubscribers, null, 2)}

RECENT AI INCIDENTS (LAST 10):
${JSON.stringify(incidents.slice(0, 10), null, 2)}

Use this data to answer the admin's questions accurately. If they ask about trends, summarize the provided data.
Keep your answers concise, professional, and helpful.

IMPORTANT: Output your response in plain text ONLY. Do NOT use Markdown, bold text, italics, headers, or bullet points. Use standard text formatting.
      `.trim();

      // Strip the initial greeting from history before sending to the AI.
      const apiMessages = messages.filter((m, i) => !(i === 0 && m.role === 'assistant'));

      const chatWithAI = httpsCallable(functions, 'chatWithAI');
      const result = await chatWithAI({
        assistant: 'admin',
        testMessages: [
          { role: 'system', content: contextMessage },
          ...apiMessages,
          { role: 'user', content: userMessage },
        ],
      });
      const data = result.data as { text: string };

      setMessages(prev => [...prev, { role: 'assistant', content: data.text || "I couldn't generate a response." }]);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message?.includes('permission-denied')
        ? 'You must be an admin to use this assistant.'
        : `Error: ${err.message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
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
      </div>

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
          disabled={isTyping}
          style={{ flex: 1, margin: 0 }}
        />
        <button type="submit" className="btn" disabled={isTyping || !input.trim()} style={{ padding: '0 1.25rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
