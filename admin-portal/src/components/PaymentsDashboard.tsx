import React, { useState, useEffect } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function PaymentsDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [activeProvider, setActiveProvider] = useState<'stripe' | 'paypal' | 'google_play' | 'apple_store' | 'apple_pay' | 'paddle' | 'coinbase'>('stripe');

  // Stripe Settings
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // PayPal Settings
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [paypalEnvironment, setPaypalEnvironment] = useState<'sandbox' | 'live'>('sandbox');

  // Google Play Settings
  const [googlePlayPackageName, setGooglePlayPackageName] = useState('');
  const [googlePlayServiceAccount, setGooglePlayServiceAccount] = useState('');

  // Apple Store Settings
  const [appleStoreBundleId, setAppleStoreBundleId] = useState('');
  const [appleStoreSharedSecret, setAppleStoreSharedSecret] = useState('');

  // Apple Pay Settings
  const [applePayMerchantId, setApplePayMerchantId] = useState('');

  // Paddle Settings
  const [paddleVendorId, setPaddleVendorId] = useState('');
  const [paddleApiKey, setPaddleApiKey] = useState('');

  // Coinbase Commerce Settings
  const [coinbaseApiKey, setCoinbaseApiKey] = useState('');
  const [coinbaseWebhookSecret, setCoinbaseWebhookSecret] = useState('');

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

          setGooglePlayPackageName(data.googlePlayPackageName || '');
          setGooglePlayServiceAccount(data.googlePlayServiceAccount || '');

          setAppleStoreBundleId(data.appleStoreBundleId || '');
          setAppleStoreSharedSecret(data.appleStoreSharedSecret || '');

          setApplePayMerchantId(data.applePayMerchantId || '');

          setPaddleVendorId(data.paddleVendorId || '');
          setPaddleApiKey(data.paddleApiKey || '');

          setCoinbaseApiKey(data.coinbaseApiKey || '');
          setCoinbaseWebhookSecret(data.coinbaseWebhookSecret || '');
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
        googlePlayPackageName,
        googlePlayServiceAccount,
        appleStoreBundleId,
        appleStoreSharedSecret,
        applePayMerchantId,
        paddleVendorId,
        paddleApiKey,
        coinbaseApiKey,
        coinbaseWebhookSecret,
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
              onChange={(e) => setActiveProvider(e.target.value as any)}
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="google_play">Google Play Store</option>
              <option value="apple_store">Apple App Store</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="paddle">Paddle (MoR)</option>
              <option value="coinbase">Coinbase Commerce (Crypto)</option>
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

          <div style={{ marginBottom: '2rem', display: activeProvider === 'google_play' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Google Play Store Configuration</h3>
            
            <label className="input-label">App Package Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="com.example.app"
              value={googlePlayPackageName}
              onChange={(e) => setGooglePlayPackageName(e.target.value)}
            />

            <label className="input-label">Service Account JSON (Base64 or Raw)</label>
            <textarea 
              className="input-field" 
              placeholder="{...}"
              rows={4}
              value={googlePlayServiceAccount}
              onChange={(e) => setGooglePlayServiceAccount(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'apple_store' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#a855f7' }}>Apple App Store Configuration</h3>
            
            <label className="input-label">Bundle ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="com.example.app"
              value={appleStoreBundleId}
              onChange={(e) => setAppleStoreBundleId(e.target.value)}
            />

            <label className="input-label">App-Specific Shared Secret</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter shared secret"
              value={appleStoreSharedSecret}
              onChange={(e) => setAppleStoreSharedSecret(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'apple_pay' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#f43f5e' }}>Apple Pay Configuration</h3>
            
            <label className="input-label">Merchant ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="merchant.com.example"
              value={applePayMerchantId}
              onChange={(e) => setApplePayMerchantId(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'paddle' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#eab308' }}>Paddle Configuration</h3>
            
            <label className="input-label">Vendor ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., 123456"
              value={paddleVendorId}
              onChange={(e) => setPaddleVendorId(e.target.value)}
            />

            <label className="input-label">API Key</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter Paddle API Key"
              value={paddleApiKey}
              onChange={(e) => setPaddleApiKey(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem', display: activeProvider === 'coinbase' ? 'block' : 'none' }}>
            <h3 style={{ marginBottom: '1rem', color: '#06b6d4' }}>Coinbase Commerce Configuration</h3>
            
            <label className="input-label">API Key</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter Coinbase API Key"
              value={coinbaseApiKey}
              onChange={(e) => setCoinbaseApiKey(e.target.value)}
            />

            <label className="input-label">Webhook Shared Secret</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter Webhook Secret"
              value={coinbaseWebhookSecret}
              onChange={(e) => setCoinbaseWebhookSecret(e.target.value)}
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
