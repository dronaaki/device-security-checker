import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, LayoutTemplate } from 'lucide-react';
import { db } from '../firebase';

export function WebsiteEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [content, setContent] = useState({
    heroTitle: 'Your Device. <br />\n<span className="text-gradient">Secured by AI.</span>',
    heroSubtitle: "Unhackme is the world's most advanced AI-powered Hack Status Checker.\nInstantly detect threats, spy apps, and unauthorized access with zero configuration.",
    
    featuresTitle: 'Intelligence inside.',
    featuresSubtitle: 'A proactive security engine that never sleeps.',
    features: [
      { title: 'AI Threat Detection', description: 'Our neural engine scans your device in real-time, identifying complex zero-day malware that traditional antivirus misses.' },
      { title: 'App Auditing', description: 'Instantly discover apps that are secretly accessing your camera, microphone, or location without your knowledge.' },
      { title: 'Total Privacy', description: 'All scans are performed on-device or anonymously. We never collect your personal data or browsing history.' }
    ],

    downloadTitle: 'Available everywhere.',
    downloadSubtitle: 'Download Unhackme for your primary devices today.',
    
    pricingTitle: 'Flexible protection plans.',
    pricingSubtitle: 'Choose the subscription plan that fits your security needs. Cancel anytime.',
    plans: [
      {
        id: 'monthly',
        name: 'Monthly Plan',
        price: '$9.99',
        period: '/month',
        badge: '',
        description: 'Flexible monthly security for active device monitoring.',
        features: ['Real-time AI threat scanning', 'App privacy & permissions audit', 'Protection for up to 3 devices', 'Cancel anytime']
      },
      {
        id: 'semi-annual',
        name: 'Semi-Annual Plan',
        price: '$49.99',
        period: '/6 months',
        badge: 'Save 16%',
        description: 'Half-year continuous protection with priority definition updates.',
        features: ['Everything in Monthly', 'Save 16% off monthly rate', 'Priority AI neural engine access', '24/7 Priority support']
      },
      {
        id: 'yearly',
        name: 'Yearly Plan',
        price: '$89.99',
        period: '/year',
        badge: 'Best Value • Save 25%',
        description: 'Complete 1-Year AI security with VIP priority support.',
        features: ['Everything in Semi-Annual', 'Save 25% off monthly rate ($7.50/mo equivalent)', 'VIP priority support', 'Early access to zero-day definitions']
      }
    ]
  });

  useEffect(() => {
    async function loadContent() {
      try {
        const docRef = doc(db, 'website_content', 'main');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setContent(prev => ({ ...prev, ...snapshot.data() }));
        }
      } catch (err) {
        console.error("Failed to load website content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleChange = (field: string, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    setContent(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      return { ...prev, features: newFeatures };
    });
  };

  const handlePlanChange = (index: number, field: string, value: string) => {
    setContent(prev => {
      const newPlans = [...(prev.plans || [])];
      newPlans[index] = { ...newPlans[index], [field]: value };
      return { ...prev, plans: newPlans };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'website_content', 'main'), content);
      alert('Website content saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save content.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading editor...</div>;
  }

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <LayoutTemplate color="#8b5cf6" size={28} />
        <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Website Content Editor (CMS)</h2>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Hero Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Hero Section</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Hero Title (Supports HTML)</label>
                <input className="input-field" value={content.heroTitle} onChange={e => handleChange('heroTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Hero Subtitle</label>
                <textarea className="input-field" rows={3} value={content.heroSubtitle} onChange={e => handleChange('heroSubtitle', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Features Section</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Features Title</label>
                <input className="input-field" value={content.featuresTitle} onChange={e => handleChange('featuresTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Features Subtitle</label>
                <input className="input-field" value={content.featuresSubtitle} onChange={e => handleChange('featuresSubtitle', e.target.value)} />
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Feature Items</h4>
              {content.features.map((feat, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                  <input className="input-field" placeholder="Feature Title" value={feat.title} onChange={e => handleFeatureChange(i, 'title', e.target.value)} />
                  <input className="input-field" placeholder="Description" value={feat.description} onChange={e => handleFeatureChange(i, 'description', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Download Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Download Section</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Download Title</label>
                <input className="input-field" value={content.downloadTitle} onChange={e => handleChange('downloadTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Download Subtitle</label>
                <input className="input-field" value={content.downloadSubtitle} onChange={e => handleChange('downloadSubtitle', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Pricing Subscription Plans Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Subscription Plans (3 Tiers)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Pricing Section Title</label>
                <input className="input-field" value={content.pricingTitle} onChange={e => handleChange('pricingTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Pricing Section Subtitle</label>
                <input className="input-field" value={content.pricingSubtitle} onChange={e => handleChange('pricingSubtitle', e.target.value)} />
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Subscription Cards Editor</h4>
              {(content.plans || []).map((plan, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="input-label">Plan Name</label>
                      <input className="input-field" value={plan.name} onChange={e => handlePlanChange(i, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Price (e.g. $9.99)</label>
                      <input className="input-field" value={plan.price} onChange={e => handlePlanChange(i, 'price', e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Badge (Optional)</label>
                      <input className="input-field" placeholder="e.g. Save 25%" value={plan.badge || ''} onChange={e => handlePlanChange(i, 'badge', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Description</label>
                    <input className="input-field" value={plan.description} onChange={e => handlePlanChange(i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} style={{ marginRight: '0.5rem' }} />
              {saving ? 'Saving...' : 'Save Website Content'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
