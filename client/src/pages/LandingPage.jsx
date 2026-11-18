import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, MessageCircle, Moon, Sun, Timer, Zap } from 'lucide-react';
import { useThemeStore } from '@/context/store';
import '@/styles/LandingPage.css';

const features = [
  {
    icon: Lock,
    title: 'Private rooms',
    description: 'Create public rooms or protect access with a room password.',
  },
  {
    icon: Timer,
    title: 'Auto-deleting messages',
    description: 'Choose a room timer, from one hour to one week, or keep messages permanently.',
  },
  {
    icon: Zap,
    title: 'Real-time delivery',
    description: 'Messages and typing updates arrive instantly over Socket.IO.',
  },
];

export default function LandingPage() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link to="/" className="landing-brand" aria-label="RelayChat home">
          <span className="brand-emoji" aria-hidden="true">
            <MessageCircle size={22} />
          </span>
          <span className="brand-name">RelayChat</span>
        </Link>
        <div className="landing-nav-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="nav-action-btn secondary">
            Sign in
          </Link>
          <Link to="/signup" className="nav-action-btn primary">
            Get started
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
          <h1 className="hero-title">
            Private rooms.
            <br />
            Real-time conversation.
          </h1>
          <p className="hero-desc">
            RelayChat brings public and password-protected rooms, encrypted message storage, and
            auto-deleting timers into one focused chat app.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="cta-primary">
              Start free
            </Link>
            <Link to="/how-it-works" className="cta-secondary">
              See how it works
            </Link>
          </div>
          <p className="hero-note">
            RelayChat uses server-managed encryption keys. It is not end-to-end encrypted.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <Icon size={24} />
              </div>
              <h2 className="feature-title">{title}</h2>
              <p className="feature-desc">{description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
