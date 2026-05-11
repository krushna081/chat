import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, MessageCircle, Zap } from 'lucide-react';
import '@/styles/LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-emoji">&#128274;</span>
          <span className="brand-name">SecureChat</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login">
            <button className="nav-action-btn secondary">Sign in</button>
          </Link>
          <Link to="/signup">
            <button className="nav-action-btn primary">Get started</button>
          </Link>
        </div>
      </nav>

      <div className="landing-content">
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="hero-title">Private messaging<br />reimagined</h1>
          <p className="hero-desc">
            End-to-end encrypted. Self-destructing messages.<br className="hero-br" />
            Your conversations stay between you.
          </p>
          <div className="hero-cta">
            <Link to="/signup">
              <button className="cta-primary">Start free</button>
            </Link>
            <button className="cta-secondary">See how it works</button>
          </div>
        </motion.div>

        <motion.div
          className="features-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {[
            { icon: '&#128274;', title: 'End-to-End Encrypted', desc: 'AES-256 GCM encryption' },
            { icon: '&#128340;', title: 'Self-Destructing', desc: 'Messages auto-delete' },
            { icon: '&#9889;', title: 'Real-Time', desc: 'Instant messaging' },
          ].map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" dangerouslySetInnerHTML={{ __html: feature.icon }} />
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}