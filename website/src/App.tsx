import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  Apple, 
  Play, 
  Download, 
  Laptop, 
  Monitor,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { CustomerSupportChat } from './components/CustomerSupportChat';

function App() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState('');

  const [websiteContent, setWebsiteContent] = useState({
    heroTitle: 'Your Device. <br />\n<span class="text-gradient">Secured by AI.</span>',
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
    pricingTitle: 'One price. Complete security.',
    pricingSubtitle: 'No subscriptions. No hidden fees. Just peace of mind.',
    pricingPrice: '$29.99',
    pricingFeatures: ['Lifetime AI updates', 'Protection for up to 3 devices', 'Priority 24/7 support']
  });

  useEffect(() => {
    async function loadContent() {
      try {
        const docRef = doc(db, 'website_content', 'main');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setWebsiteContent(prev => ({ ...prev, ...snapshot.data() }));
        }
      } catch (err) {
        console.error("Failed to load website content:", err);
      }
    }
    loadContent();
  }, []);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ...formState,
        timestamp: new Date().toISOString(),
        source: 'unhackme-website'
      });
      setFormStatus('success');
      setFormState({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("Support submission failed:", error);
      setFormStatus('error');
    }
  };

  const handleCheckout = async () => {
    setCheckoutStatus('loading');
    setCheckoutError('');
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession();
      const data = result.data as { url: string };
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      setCheckoutStatus('error');
      setCheckoutError(error.message || 'Payment provider not configured.');
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <a href="#" className="nav-brand">
          <ShieldCheck color="#06b6d4" />
          Unhackme
        </a>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#download" className="nav-link">Download</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#support" className="nav-link">Support</a>
        </div>
        <a href="#download" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Get App
        </a>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="ambient-glow"></div>
        <div className="container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 variants={fadeInUp} dangerouslySetInnerHTML={{ __html: websiteContent.heroTitle }} />
            <motion.p variants={fadeInUp}>
              {websiteContent.heroSubtitle}
            </motion.p>
            <motion.div variants={fadeInUp} className="hero-badges">
              <a href="#download" className="btn btn-primary">
                <Apple size={20} /> App Store
              </a>
              <a href="#download" className="btn btn-outline">
                <Play size={20} /> Google Play
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-image-wrapper mx-auto"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          >
            <img src="/hero.png" alt="Unhackme App on Smartphone" className="hero-image" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section">
        <div className="container">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-gradient">{websiteContent.featuresTitle}</h2>
            <p className="mx-auto">{websiteContent.featuresSubtitle}</p>
          </motion.div>

          <motion.div 
            className="card-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="card" variants={fadeInUp}>
              <Cpu size={48} color="#06b6d4" style={{ marginBottom: '1.5rem' }} />
              <h3>{websiteContent.features[0]?.title}</h3>
              <p style={{ fontSize: '1rem' }}>{websiteContent.features[0]?.description}</p>
            </motion.div>
            
            <motion.div className="card" variants={fadeInUp}>
              <Smartphone size={48} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
              <h3>{websiteContent.features[1]?.title}</h3>
              <p style={{ fontSize: '1rem' }}>{websiteContent.features[1]?.description}</p>
            </motion.div>

            <motion.div className="card" variants={fadeInUp}>
              <Lock size={48} color="#f5f5f7" style={{ marginBottom: '1.5rem' }} />
              <h3>{websiteContent.features[2]?.title}</h3>
              <p style={{ fontSize: '1rem' }}>{websiteContent.features[2]?.description}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="section" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="container">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2>{websiteContent.downloadTitle}</h2>
            <p className="mx-auto">{websiteContent.downloadSubtitle}</p>
          </motion.div>

          <motion.div 
            className="card-grid"
            style={{ marginTop: '3rem' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="card" variants={fadeInUp} style={{ background: 'var(--bg-dark)' }}>
              <Apple size={40} style={{ marginBottom: '1rem' }} />
              <h3>iOS</h3>
              <p style={{ fontSize: '0.9rem' }}>Requires iOS 15.0 or later.</p>
              <button className="btn btn-primary" style={{ width: '100%' }}>Download on App Store</button>
            </motion.div>

            <motion.div className="card" variants={fadeInUp} style={{ background: 'var(--bg-dark)' }}>
              <Play size={40} style={{ marginBottom: '1rem' }} />
              <h3>Android</h3>
              <p style={{ fontSize: '0.9rem' }}>Get it on Google Play.</p>
              <button className="btn btn-outline" style={{ width: '100%', marginBottom: '1rem' }}>Get it on Google Play</button>
              <button className="btn btn-outline" style={{ width: '100%', borderStyle: 'dashed' }}>
                <Download size={16} /> Direct APK Download
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="card-grid"
            style={{ marginTop: '2rem' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="card" variants={fadeInUp} style={{ opacity: 0.6, background: 'var(--bg-dark)' }}>
              <Laptop size={40} style={{ marginBottom: '1rem' }} />
              <h3>MacBook</h3>
              <p style={{ fontSize: '0.9rem' }}>Apple Silicon & Intel.</p>
              <button className="btn btn-outline" disabled style={{ width: '100%', cursor: 'not-allowed' }}>Coming Soon</button>
            </motion.div>

            <motion.div className="card" variants={fadeInUp} style={{ opacity: 0.6, background: 'var(--bg-dark)' }}>
              <Monitor size={40} style={{ marginBottom: '1rem' }} />
              <h3>Windows PC</h3>
              <p style={{ fontSize: '0.9rem' }}>Windows 10/11 required.</p>
              <button className="btn btn-outline" disabled style={{ width: '100%', cursor: 'not-allowed' }}>Coming Soon</button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing / Payment Section */}
      <section id="pricing" className="section">
        <div className="container">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2>{websiteContent.pricingTitle}</h2>
            <p className="mx-auto">{websiteContent.pricingSubtitle}</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="form-container"
            style={{ marginTop: '3rem', textAlign: 'center' }}
          >
            <h3 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{websiteContent.pricingPrice}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/lifetime</span></h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0', textAlign: 'left', display: 'inline-block' }}>
              {websiteContent.pricingFeatures.map((feat, idx) => (
                <li key={idx} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 color="#06b6d4" size={20} /> {feat}
                </li>
              ))}
            </ul>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              onClick={handleCheckout}
              disabled={checkoutStatus === 'loading'}
            >
              {checkoutStatus === 'loading' ? 'Initializing Secure Checkout...' : 'Buy Now securely with Stripe'}
            </button>
            {checkoutStatus === 'error' && (
              <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>
                Error: {checkoutError}
              </p>
            )}
            <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Apple Pay, Google Pay, and standard cards supported during checkout.</p>
          </motion.div>
        </div>
      </section>

      {/* Support / Feedback Section */}
      <section id="support" className="section" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="container">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2>We're here to help.</h2>
            <p className="mx-auto">Have a question or found a bug? Let our support team know.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="form-container"
            style={{ marginTop: '3rem' }}
          >
            <form onSubmit={handleSupportSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({...formState, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({...formState, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  required
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={formStatus === 'submitting'}
              >
                {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>

              {formStatus === 'success' && (
                <p style={{ color: '#10b981', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                  Message sent successfully! We'll get back to you soon.
                </p>
              )}
              {formStatus === 'error' && (
                <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                  Failed to send message. Please try again.
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <ShieldCheck color="#06b6d4" size={32} style={{ margin: '0 auto 1rem' }} />
          <p className="mx-auto" style={{ fontSize: '0.9rem' }}>
            &copy; {new Date().getFullYear()} Unhackme Security. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Website Customer Support AI Widget */}
      <CustomerSupportChat onCheckout={handleCheckout} />
    </>
  );
}

export default App;
