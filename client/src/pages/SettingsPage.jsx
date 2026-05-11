import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useThemeStore } from '@/context/store';
import { userAPI } from '@/services/api';
import { ArrowLeft, Moon, Droplet, Sun, Shield, CheckCircle, Lock, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import '@/styles/SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  
  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Profile picture
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const themes = [
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Classic dark theme', colors: ['#0b141a', '#1f2c33', '#00a884'] },
    { value: 'blue', label: 'Ocean Blue', icon: Droplet, desc: 'Cool blue accent', colors: ['#0d1b2a', '#1e3a5f', '#38bdf8'] },
    { value: 'white', label: 'Light', icon: Sun, desc: 'Clean & bright', colors: ['#f0f2f5', '#ffffff', '#128c7e'] },
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

  const handleUsernameSave = async () => {
    if (!newUsername.trim() || newUsername === user?.username) {
      setEditingUsername(false);
      return;
    }
    if (newUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    setUsernameLoading(true);
    try {
      const response = await userAPI.updateProfile({ username: newUsername.trim() });
      const updatedUser = { ...user, username: newUsername.trim() };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditingUsername(false);
      toast.success('Username updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setAvatarLoading(true);
      try {
        const response = await userAPI.updateProfile({ avatar: base64 });
        const updatedUser = { ...user, avatar: response.data.user.avatar };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile picture updated');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to upload profile picture');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://api-chat-1xj6.onrender.com'}${avatar}`;
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
        {/* Profile Section */}
        <div className="settings-card profile-card">
          <div className="profile-section">
            <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
              {avatarLoading ? (
                <div className="profile-avatar-loading">
                  <div className="avatar-spinner" />
                </div>
              ) : getAvatarUrl(user?.avatar) ? (
                <img src={getAvatarUrl(user.avatar)} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar initials-avatar">
                  {getInitials(user?.username)}
                </div>
              )}
              <div className="avatar-overlay">
                <Camera size={16} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            
            <div className="profile-info">
              {editingUsername ? (
                <div className="username-edit">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="username-input"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleUsernameSave}
                    disabled={usernameLoading}
                    className="username-save-btn"
                  >
                    {usernameLoading ? 'Saving...' : <Save size={16} />}
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setNewUsername(user?.username || ''); }}
                    className="username-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="username-display">
                  <h2 className="profile-name">{user?.username || 'User'}</h2>
                  <button onClick={() => setEditingUsername(true)} className="edit-username-btn">
                    Edit
                  </button>
                </div>
              )}
              <p className="profile-email">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="settings-card">
          <h3 className="settings-section-title">Appearance</h3>
          <p className="settings-section-desc">Choose your preferred theme</p>
          <div className="theme-grid">
            {themes.map(({ value, label, icon: Icon, desc, colors }) => (
              <motion.button
                key={value}
                onClick={() => handleThemeChange(value)}
                disabled={loading}
                className={`theme-option ${theme === value ? 'active' : ''}`}
                whileTap={{ scale: 0.97 }}
              >
                <div className="theme-preview" style={{ background: colors[0] }}>
                  <div className="theme-preview-header" style={{ background: colors[1] }} />
                  <div className="theme-preview-body">
                    <div className="theme-preview-msg" style={{ background: colors[2] }} />
                  </div>
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

        {/* Security Section */}
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

        {/* Privacy Section */}
        <div className="settings-card">
          <div className="card-header">
            <Lock size={20} />
            <h3 className="settings-section-title" style={{ marginBottom: 0 }}>Privacy</h3>
          </div>
          <ul className="privacy-list">
            <li><CheckCircle size={14} /> End-to-end encrypted messages</li>
            <li><CheckCircle size={14} /> No message storage on server</li>
            <li><CheckCircle size={14} /> Self-destructing messages</li>
            <li><CheckCircle size={14} /> No third-party data sharing</li>
          </ul>
        </div>

        {/* About Section */}
        <div className="settings-card about-card">
          <h3 className="settings-section-title">About</h3>
          <p className="about-desc">SecureChat combines WhatsApp-style UX with Signal-style privacy.</p>
          <p className="about-version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}