import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Timer, Zap, Key, MessageSquare } from 'lucide-react';
import '@/styles/HowItWorks.css';

const steps = [
  {
    icon: <Key />,
    emoji: '🔐',
    title: 'End-to-End Encryption',
    desc: 'All your messages are encrypted using AES-256 GCM before they leave your device. Only you and the recipient can read them—not even we can access your messages.',
  },
  {
    icon: <Timer />,
    emoji: '⏱️',
    title: 'Self-Destructing Messages',
    desc: 'Set a timer on any message. Once read, it automatically deletes after your chosen duration—24 hours, 1 hour, or 30 seconds. No traces left behind.',
  },
  {
    icon: <Zap />,
    emoji: '⚡',
    title: 'Real-Time Delivery',
    desc: 'Messages are delivered instantly via WebSocket connections. No refreshing, no delays—just seamless, instant communication.',
  },
  {
    icon: <Shield />,
    emoji: '🛡️',
    title: 'Private by Default',
    desc: 'No phone number required to sign up. We don\'t store your contacts or track who you message. Your privacy is built into the core.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <nav className="hiw-nav">
        <Link to="/" className="hiw-back">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
        <div className="hiw-brand">
          <span className="brand-emoji">&#128274;</span>
          <span className="brand-name">SecureChat</span>
        </div>
        <div className="hiw-nav-actions">
          <Link to="/login">
            <button className="nav-action-btn secondary">Sign in</button>
          </Link>
          <Link to="/signup">
            <button className="nav-action-btn primary">Get started</button>
          </Link>
        </div>
      </nav>

      <div className="hiw-content">
        <motion.div
          className="hiw-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="hiw-title">How SecureChat works</h1>
          <p className="hiw-desc">
            Your privacy-first messaging app. Here's what makes us different.
          </p>
        </motion.div>

        <div className="hiw-steps">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="hiw-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">
                <span className="step-emoji">{step.emoji}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="hiw-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="cta-text">Ready to start messaging privately?</p>
          <div className="cta-buttons">
            <Link to="/signup">
              <button className="cta-primary">Create account</button>
            </Link>
            <Link to="/login">
              <button className="cta-secondary">Sign in</button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}