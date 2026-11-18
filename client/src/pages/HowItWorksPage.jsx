import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Key, MessageCircle, Shield, Timer, Zap } from 'lucide-react';
import '@/styles/HowItWorks.css';

const steps = [
  {
    icon: Shield,
    title: 'Room-level access',
    desc: 'Create public rooms or protect a room with a password. Only members of a room can read its messages and socket events.',
  },
  {
    icon: Key,
    title: 'Encrypted message storage',
    desc: 'Messages are encrypted with AES-256-GCM before storage and decrypted in the browser for authorized room members. Room keys are managed by the server, so this is not end-to-end encryption.',
  },
  {
    icon: Timer,
    title: 'Auto-deleting messages',
    desc: 'Choose a room timer from one hour to one week, or keep messages permanently. MongoDB TTL indexes remove expired messages.',
  },
  {
    icon: Zap,
    title: 'Real-time delivery',
    desc: 'Messages and typing indicators travel over Socket.IO, backed by the same Express server that serves the React app.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="how-it-works-page">
      <nav className="hiw-nav" aria-label="How RelayChat works">
        <Link to="/" className="hiw-back">
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Back</span>
        </Link>
        <Link to="/" className="hiw-brand" aria-label="RelayChat home">
          <span className="brand-emoji" aria-hidden="true">
            <MessageCircle size={20} />
          </span>
          <span className="brand-name">RelayChat</span>
        </Link>
        <div className="hiw-nav-actions">
          <Link to="/login" className="nav-action-btn secondary">
            Sign in
          </Link>
          <Link to="/signup" className="nav-action-btn primary">
            Get started
          </Link>
        </div>
      </nav>

      <main className="hiw-content">
        <motion.div
          className="hiw-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="hiw-title">How RelayChat works</h1>
          <p className="hiw-desc">
            One service, one origin, and a straightforward privacy model you can inspect.
          </p>
        </motion.div>

        <div className="hiw-steps">
          {steps.map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              className="hiw-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-icon" aria-hidden="true">
                <Icon size={26} />
              </div>
              <h2 className="step-title">{title}</h2>
              <p className="step-desc">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="hiw-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="cta-text">
            RelayChat is not end-to-end encrypted. The server holds room keys and can decrypt stored
            messages.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-primary">
              Create account
            </Link>
            <Link to="/login" className="cta-secondary">
              Sign in
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
