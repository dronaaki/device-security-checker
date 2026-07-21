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
    
    pricingTitle: 'Simple, transparent pricing.',
    pricingPrice: '$29.99',
    pricingFeatures: ['Lifetime AI definition updates', 'Protection for up to 3 devices', '24/7 priority customer support']
  });

  useEffect(() => {
    async function loadContent() {
      try {
        const docRef = doc(db, 'website_content', 'main');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setContent({ ...content, ...snapshot.data() });
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

  const handlePricingFeatureChange = (index: number, value: string) => {
    setContent(prev => {
      const newFeatures = [...prev.pricingFeatures];
      newFeatures[index] = value;
      return { ...prev, pricingFeatures: newFeatures };
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
                <textarea className="input-field" value={content.heroTitle} onChange={e => handleChange('heroTitle', e.target.value)} rows={3} />
              </div>
              <div>
                <label className="input-label">Hero Subtitle</label>
                <textarea className="input-field" value={content.heroSubtitle} onChange={e => handleChange('heroSubtitle', e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Features Section</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="input-label">Features Title</label>
                <input className="input-field" value={content.featuresTitle} onChange={e => handleChange('featuresTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Features Subtitle</label>
                <input className="input-field" value={content.featuresSubtitle} onChange={e => handleChange('featuresSubtitle', e.target.value)} />
              </div>
            </div>

            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Feature Cards</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {content.features.map((feature, i) => (
                <div key={i} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
                  <label className="input-label">Card {i + 1} Title</label>
                  <input className="input-field" value={feature.title} onChange={e => handleFeatureChange(i, 'title', e.target.value)} />
                  <label className="input-label">Card {i + 1} Description</label>
                  <textarea className="input-field" value={feature.description} onChange={e => handleFeatureChange(i, 'description', e.target.value)} rows={3} />
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

          {/* Pricing Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Pricing Section</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Pricing Title</label>
                <input className="input-field" value={content.pricingTitle} onChange={e => handleChange('pricingTitle', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Price Display (e.g. $29.99)</label>
                <input className="input-field" value={content.pricingPrice} onChange={e => handleChange('pricingPrice', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Included Features (List)</label>
                {content.pricingFeatures.map((feat, i) => (
                  <input key={i} className="input-field" style={{ marginBottom: '0.5rem' }} value={feat} onChange={e => handlePricingFeatureChange(i, e.target.value)} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} style={{ marginRight: '0.5rem' }} />
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
