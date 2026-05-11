import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useThemeStore } from '@/context/store';
import { userAPI } from '@/services/api';
import { ArrowLeft, Moon, Sun, Zap, Droplet, Square, Circle, Shield, CheckCircle, Lock, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/styles/SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);

  const themes = [
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'light', label: 'Light', icon: Sun, desc: 'Clean interface' },
    { value: 'cyber', label: 'Teal', icon: Zap, desc: 'Green accents' },
    { value: 'blue', label: 'Blue', icon: Droplet, desc: 'Cool contrast' },
    { value: 'black', label: 'Pure Black', icon: Square, desc: 'OLED-friendly' },
    { value: 'white', label: 'White', icon: Circle, desc: 'Minimal look' },
  ];

  const handleThemeChange = async (newTheme) => {
    try {
      setLoading(true);
      await userAPI.updateProfile({ theme: newTheme });
      setTheme(newTheme);
      toast.success('Theme updated');
    } catch {
      toast.error('Failed to update theme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={() => navigate('/dashboard')} className="settings-back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="profile-section">
            <div className="profile-avatar">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user?.username || 'User'}</h2>
              <p className="profile-email">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-section-title">Appearance</h3>
          <p className="settings-section-desc">Choose your preferred theme</p>
          <div className="theme-grid">
            {themes.map(({ value, label, icon: Icon, desc }) => (
              <motion.button
                key={value}
                onClick={() => handleThemeChange(value)}
                disabled={loading}
                className={`theme-option ${theme === value ? 'active' : ''}`}
                whileTap={{ scale: 0.97 }}
              >
                <div className="theme-icon">
                  <Icon size={18} />
                </div>
                <div className="theme-info">
                  <span className="theme-label">{label}</span>
                  <span className="theme-desc">{desc}</span>
                </div>
                {theme === value && (
                  <div className="theme-check">
                    <CheckCircle size={16} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="settings-card security-card">
          <div className="card-header">
            <Shield size={20} />
            <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Security</h3>
          </div>
          <ul className="security-list">
            <li className="security-item">
              <CheckCircle size={15} />
              <div>
                <span className="security-title">End-to-End Encryption</span>
                <span className="security-desc">All messages encrypted before leaving your device</span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} />
              <div>
                <span className="security-title">Self-Destructing Messages</span>
                <span className="security-desc">Messages auto-delete based on room timer</span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} />
              <div>
                <span className="security-title">Local Key Storage</span>
                <span className="security-desc">Encryption keys stored only on your device</span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} />
              <div>
                <span className="security-title">Zero Knowledge Architecture</span>
                <span className="security-desc">Server never has access to your keys or messages</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <Lock size={20} />
            <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Privacy</h3>
          </div>
          <ul className="privacy-list">
            <li><CircleDot size={14} /> Text and emoji messages only</li>
            <li><CircleDot size={14} /> No media file uploads</li>
            <li><CircleDot size={14} /> IP protection via CORS</li>
            <li><CircleDot size={14} /> No third-party integrations</li>
          </ul>
        </div>

        <div className="settings-card about-card">
          <h3 className="settings-section-title">About</h3>
          <p className="about-desc">SecureChat combines WhatsApp-style UX with Signal-style privacy.</p>
          <p className="about-version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}