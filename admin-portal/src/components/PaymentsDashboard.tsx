import React, { useState, useEffect } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function PaymentsDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [activeProvider, setActiveProvider] = useState<'stripe' | 'paypal'>('stripe');

  // Stripe Settings
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // PayPal Settings
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [paypalEnvironment, setPaypalEnvironment] = useState<'sandbox' | 'live'>('sandbox');

  useEffect(() => {
    async function loadConfig() {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'payment_provider'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setActiveProvider(data.activeProvider || 'stripe');
          
          setStripePublishableKey(data.stripePublishableKey || '');
          setStripeSecretKey(data.stripeSecretKey || '');
          setStripeWebhookSecret(data.stripeWebhookSecret || '');
          
          setPaypalClientId(data.paypalClientId || '');
          setPaypalSecret(data.paypalSecret || '');
          setPaypalEnvironment(data.paypalEnvironment || 'sandbox');
        }
      } catch (err) {
        console.error("Failed to load payment config", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'payment_provider'), {
        activeProvider,
        stripePublishableKey,
        stripeSecretKey,
        stripeWebhookSecret,
        paypalClientId,
        paypalSecret,
        paypalEnvironment,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Payment configuration saved successfully!');
    } catch (err) {
      console.error("Failed to save payment config", err);
      alert('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payments config...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <CreditCard color="var(--accent-color)" size={28} />
        <h2 style={{ margin: 0 }}>Payment Systems Configuration</h2>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Active Provider</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select which payment gateway will be used for new subscriptions.
            </p>
            <select 
              className="input-field" 
              value={activeProvider} 
              onChange={(e) => setActiveProvider(e.target.value as 'stripe' | 'paypal')}
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'stripe' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#6366f1' }}>Stripe Configuration</h3>
            
            <label className="input-label">Publishable Key</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="pk_test_..."
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
            />

            <label className="input-label">Secret Key</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="sk_test_..."
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
            />

            <label className="input-label">Webhook Secret (Optional)</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="whsec_..."
              value={stripeWebhookSecret}
              onChange={(e) => setStripeWebhookSecret(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'paypal' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#3b82f6' }}>PayPal Configuration</h3>
            
            <label className="input-label">Environment</label>
            <select 
              className="input-field" 
              value={paypalEnvironment} 
              onChange={(e) => setPaypalEnvironment(e.target.value as 'sandbox' | 'live')}
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="live">Live (Production)</option>
            </select>

            <label className="input-label">Client ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="PayPal Client ID"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
            />

            <label className="input-label">Secret</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="PayPal Secret"
              value={paypalSecret}
              onChange={(e) => setPaypalSecret(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" disabled={saving} style={{ width: '100%', marginTop: '1rem' }}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Payment Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
