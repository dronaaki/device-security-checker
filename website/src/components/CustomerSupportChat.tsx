import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ShieldCheck, Sparkles, ArrowRight, Bot } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

interface CustomerSupportChatProps {
  onCheckout: () => void;
}

export function CustomerSupportChat({ onCheckout }: CustomerSupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [botName, setBotName] = useState('Unhackme AI Support');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! 👋 Wondering if your device is secure? Ask me anything or let me help you protect your phone!');
  const [ctaText, setCtaText] = useState('Get Lifetime Protection ($29.99)');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadWidgetConfig() {
      try {
        const docRef = doc(db, 'config', 'website_support_ai');
        const snap = await getDoc(docRef);
        let delay = 3;
        if (snap.exists()) {
          const data = snap.data();
          if (data.botName) setBotName(data.botName);
          if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
          if (data.ctaText) setCtaText(data.ctaText);
          if (data.autoOpenDelay !== undefined) delay = Number(data.autoOpenDelay);
        }

        // Initialize welcome message
        setMessages([{ role: 'assistant', content: snap.data()?.welcomeMessage || welcomeMessage }]);

        // Show auto-popup speech bubble after delay
        if (delay > 0) {
          const timer = setTimeout(() => {
            setShowSpeechBubble(true);
          }, delay * 1000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Error loading support AI config:', err);
        setMessages([{ role: 'assistant', content: welcomeMessage }]);
      }
    }
    loadWidgetConfig();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setShowSpeechBubble(false);

    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const chatWithAI = httpsCallable(functions, 'chatWithAI');
      
      // Pass clean conversation array (system prompt & plain text formatting are handled server-side in Cloud Function)
      const payload = {
        assistant: 'website',
        testMessages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
      };

      const result = await chatWithAI(payload);
      const answer = (result.data as any)?.responseText || 'Thank you for reaching out! Unhackme provides complete AI-powered device security. Click the protection button below to get started!';
      
      setMessages([...updatedMessages, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: 'Unhackme protects your device from malware, unauthorized camera/microphone access, and security vulnerabilities. Click below to secure your device today!' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowSpeechBubble(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Speech Bubble Popup */}
      <AnimatePresence>
        {showSpeechBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={handleToggle}
            style={{
              position: 'absolute',
              bottom: '76px',
              right: '0',
              width: '280px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)',
              borderRadius: '16px 16px 4px 16px',
              padding: '12px 16px',
              cursor: 'pointer',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '6px', borderRadius: '50%', flexShrink: 0 }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {botName}
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.4', marginTop: '2px', color: '#e2e8f0' }}>
                {welcomeMessage}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSpeechBubble(false); }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4), 0 0 30px rgba(124, 58, 237, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative'
        }}
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
        
        {/* Pulsing online badge */}
        {!isOpen && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '14px',
            height: '14px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            border: '2px solid #0f172a'
          }} />
        )}
      </motion.button>

      {/* Floating Chat Box Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: '76px',
              right: '0',
              width: '360px',
              height: '520px',
              maxHeight: 'calc(100vh - 120px)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.15)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px', 
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(124, 58, 237, 0.2))', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
                }}>
                  <Bot size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.2px' }}>
                    {botName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                    Online • AI Security Advisor
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Drawer */}
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                      : 'rgba(30, 41, 59, 0.8)',
                    color: msg.role === 'user' ? '#ffffff' : '#f1f5f9',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              ))}

              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 2px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={14} className="animate-spin" color="#60a5fa" />
                  Generating answer...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Embedded CTA Banner */}
            <div style={{
              padding: '10px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderTop: '1px solid rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>
                  Unhackme Lifetime Plan
                </span>
              </div>
              <button
                onClick={onCheckout}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {ctaText} <ArrowRight size={12} />
              </button>
            </div>

            {/* Input Form */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.98)',
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about phone security..."
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: inputMessage.trim() ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(51, 65, 85, 0.5)',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
