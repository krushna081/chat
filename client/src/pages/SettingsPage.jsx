import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useThemeStore } from '@/context/store';
import { userAPI } from '@/services/api';
import { ArrowLeft, Moon, Sun, Zap, Droplet, Square, Circle, AlertCircle, User, Shield, CheckCircle, Lock, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/styles/SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);

  const themes = [
    { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Easy on the eyes in low light' },
    { value: 'light', label: 'Light Mode', icon: Sun, description: 'Clean white interface' },
    { value: 'cyber', label: 'Cyber Mode', icon: Zap, description: 'Futuristic neon theme' },
    { value: 'blue', label: 'Blue Mode', icon: Droplet, description: 'Cool blue contrast with white accents' },
    { value: 'black', label: 'Black Mode', icon: Square, description: 'Pure black background with sharp text' },
    { value: 'white', label: 'White Mode', icon: Circle, description: 'Minimal white interface with subtle accents' },
  ];

  const handleThemeChange = async (newTheme) => {
    try {
      setLoading(true);
      await userAPI.updateProfile({ theme: newTheme });
      setTheme(newTheme);
      toast.success('Theme updated');
    } catch (error) {
      toast.error('Failed to update theme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page min-h-screen bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900">
      {/* Header */}
      <div className="glass-dark border-b border-cyan-500/20 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition hover-lift"
          >
            <ArrowLeft size={24} className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold cyber-glow">Settings</h1>
            <div className="flex items-center gap-2 text-cyber-100">
              <AlertCircle size={20} />
              <span className="text-sm">E2EE Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Section */}
        <motion.div
          className="glass-dark p-8 rounded-xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-6">
            <div className="p-3 bg-cyber-100/20 rounded-lg">
              <User size={36} className="text-cyber-100" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{user?.username || 'User'}</h2>
              <p className="text-gray-400">{user?.email || 'Email not available'}</p>
            </div>
          </div>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          className="glass-dark p-8 rounded-xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Theme Appearance</h2>
            <p className="text-gray-400 mb-6">Choose your preferred visual theme</p>
            <div className="grid gap-4">
              {themes.map(({ value, label, icon: Icon, description }) => (
                <motion.button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  disabled={loading}
                  className={`theme-card flex flex-col items-center p-6 rounded-xl border-2 transition-all hover-lift ${
                    theme === value
                      ? 'border-cyber-100 bg-cyan-500/10'
                      : 'border-gray-600/50 hover:border-cyber-100 hover:bg-gray-900/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4">
                    <Icon size={32} className={`${value === 'cyber' ? 'cyber-glow' : ''}`} />
                  </div>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="text-xs text-gray-400 text-center">{description}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Security Info */}
        <motion.div
          className="glass-dark p-8 rounded-xl border-2 border-cyber-100 bg-cyan-500/10 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-cyber-100 flex items-center gap-3">
            <Shield size={24} />
            <span>Security</span>
          </h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-cyber-100 mt-1" />
              <div>
                <h3 className="font-medium">End-to-End Encryption</h3>
                <p className="text-sm text-gray-300">All messages are encrypted using AES-256-GCM before leaving your device</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-cyber-100 mt-1" />
              <div>
                <h3 className="font-medium">Self-Destructing Messages</h3>
                <p className="text-sm text-gray-300">Messages automatically delete based on room timer settings</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-cyber-100 mt-1" />
              <div>
                <h3 className="font-medium">Local Key Storage</h3>
                <p className="text-sm text-gray-300">Encryption keys stored securely in your device's local storage</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-cyber-100 mt-1" />
              <div>
                <h3 className="font-medium">Zero Knowledge Architecture</h3>
                <p className="text-sm text-gray-300">We never have access to your messages or encryption keys</p>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Privacy Info */}
        <motion.div
          className="glass-dark p-8 rounded-xl hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Lock size={24} />
            <span>Privacy</span>
          </h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <CircleDot size={16} className="text-gray-400 mt-1" />
              <span className="flex items-center gap-2 text-sm">
                • Text and emoji messages only
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CircleDot size={16} className="text-gray-400 mt-1" />
              <span className="flex items-center gap-2 text-sm">
                • No media file uploads
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CircleDot size={16} className="text-gray-400 mt-1" />
              <span className="flex items-center gap-2 text-sm">
                • IP address protection via CORS
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CircleDot size={16} className="text-gray-400 mt-1" />
              <span className="flex items-center gap-2 text-sm">
                • No third-party integrations
              </span>
            </li>
          </ul>
        </motion.div>

        {/* About */}
        <motion.div
          className="glass-dark p-8 rounded-xl text-center hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-4">About SecureChat</h2>
          <p className="text-gray-400 mb-4">
            A production-grade secure encrypted messaging platform combining WhatsApp-style UX with Signal-style privacy.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-600">Built with React.js, Node.js, and Web Crypto API</p>
            <div className="w-12 h-12 bg-cyber-100/20 rounded-full flex items-center justify-center">
              <Zap size={16} className="text-cyber-100" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
