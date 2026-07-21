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
    pricingTitle: 'Flexible protection plans.',
    pricingSubtitle: 'Choose the subscription plan that fits your security needs. Cancel anytime.',
    plans: [
      {
        id: 'monthly',
        name: 'Monthly Plan',
        price: '$9.99',
        period: '/month',
        badge: null,
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

  const handleCheckout = async (planId: string = 'monthly') => {
    setCheckoutStatus('loading');
    setCheckoutError('');
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({ planId });
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
            variants={staggerContainer}
            style={{ 
              marginTop: '3rem', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '2rem',
              alignItems: 'stretch'
            }}
          >
            {(websiteContent.plans || []).map((plan: any) => {
              const isYearly = plan.id === 'yearly';
              return (
                <motion.div 
                  key={plan.id}
                  variants={fadeInUp}
                  className="card"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    position: 'relative',
                    background: isYearly ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))' : 'var(--bg-card)',
                    border: isYearly ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    boxShadow: isYearly ? '0 20px 30px -10px rgba(6, 182, 212, 0.25)' : 'none',
                    padding: '2rem'
                  }}
                >
                  {plan.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{plan.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', minHeight: '40px' }}>
                      {plan.description}
                    </p>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{plan.price}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{plan.period}</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', textAlign: 'left' }}>
                      {plan.features.map((feat: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <CheckCircle2 color="#06b6d4" size={18} style={{ flexShrink: 0 }} /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button 
                      className={isYearly ? "btn btn-primary" : "btn btn-outline"}
                      style={{ width: '100%', padding: '0.85rem', fontWeight: 600 }}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutStatus === 'loading'}
                    >
                      {checkoutStatus === 'loading' ? 'Initializing...' : `Subscribe - ${plan.price}`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {checkoutStatus === 'error' && (
            <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              Error: {checkoutError}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
            Apple Pay, Google Pay, and standard credit cards supported. Cancel or manage subscriptions anytime.
          </p>
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
