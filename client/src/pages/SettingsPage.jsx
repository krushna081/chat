import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, CheckCircle, Lock, Moon, Save, Shield, Sun } from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/context/store';
import { userAPI } from '@/services/api';
import '@/styles/SettingsPage.css';

const MAX_AVATAR_BYTES = 512 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const themes = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-light, high-contrast chat',
    icon: Moon,
    colors: ['#0b141a', '#1f2c33', '#00a884'],
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright, high-contrast chat',
    icon: Sun,
    colors: ['#f0f2f5', '#ffffff', '#128c7e'],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const [loadingTheme, setLoadingTheme] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleThemeChange = async (nextTheme) => {
    if (nextTheme === theme || loadingTheme) return;
    setTheme(nextTheme);
    setLoadingTheme(true);
    try {
      await userAPI.updateProfile({ theme: nextTheme });
    } catch {
      toast.error('Theme applied locally, but your preference could not be saved');
    } finally {
      setLoadingTheme(false);
    }
  };

  const handleUsernameSave = async () => {
    const username = newUsername.trim();
    if (!username || username === user?.username) {
      setEditingUsername(false);
      return;
    }
    if (username.length < 3 || username.length > 24) {
      toast.error('Username must be between 3 and 24 characters');
      return;
    }

    setUsernameLoading(true);
    try {
      const response = await userAPI.updateProfile({ username });
      setUser(response.data.user);
      setEditingUsername(false);
      toast.success('Username updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Choose a PNG, JPEG, GIF, or WebP image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 512 KB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast.error('Could not read the image');
    reader.onload = async () => {
      setAvatarLoading(true);
      try {
        const response = await userAPI.updateProfile({ avatar: reader.result });
        setUser(response.data.user);
        toast.success('Profile picture updated');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not update profile picture');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = user?.avatar || null;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="settings-back-btn"
          aria-label="Back to rooms"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="settings-title">Settings</h1>
      </header>

      <main className="settings-content">
        <section className="settings-card profile-card" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="visually-hidden">
            Profile
          </h2>
          <div className="profile-section">
            <button
              type="button"
              className="profile-avatar-wrapper"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              {avatarLoading ? (
                <div className="profile-avatar-loading">
                  <div className="avatar-spinner" />
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar initials-avatar">{getInitials(user?.username)}</div>
              )}
              <span className="avatar-overlay" aria-hidden="true">
                <Camera size={16} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleAvatarUpload}
              className="visually-hidden"
              tabIndex={-1}
            />

            <div className="profile-info">
              {editingUsername ? (
                <div className="username-edit">
                  <label className="visually-hidden" htmlFor="settings-username">
                    Username
                  </label>
                  <input
                    id="settings-username"
                    type="text"
                    value={newUsername}
                    onChange={(event) => setNewUsername(event.target.value)}
                    className="username-input"
                    minLength={3}
                    maxLength={24}
                  />
                  <button
                    type="button"
                    onClick={handleUsernameSave}
                    disabled={usernameLoading}
                    className="username-save-btn"
                    aria-label="Save username"
                  >
                    {usernameLoading ? '…' : <Save size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername(user?.username || '');
                    }}
                    className="username-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="username-display">
                  <h2 className="profile-name">{user?.username || 'User'}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUsername(user?.username || '');
                      setEditingUsername(true);
                    }}
                    className="edit-username-btn"
                  >
                    Edit
                  </button>
                </div>
              )}
              <p className="profile-email">{user?.email || ''}</p>
            </div>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="settings-section-title">
            Appearance
          </h2>
          <p className="settings-section-desc">Choose a dark or light theme.</p>
          <div className="theme-grid">
            {themes.map(({ value, label, description, icon: Icon, colors }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => handleThemeChange(value)}
                disabled={loadingTheme}
                className={`theme-option ${theme === value ? 'active' : ''}`}
                aria-pressed={theme === value}
                whileTap={{ scale: 0.97 }}
              >
                <div className="theme-preview" style={{ background: colors[0] }}>
                  <div className="theme-preview-header" style={{ background: colors[1] }} />
                  <div className="theme-preview-body">
                    <div className="theme-preview-msg" style={{ background: colors[2] }} />
                  </div>
                </div>
                <div className="theme-info">
                  <span className="theme-label">
                    <Icon size={15} aria-hidden="true" /> {label}
                  </span>
                  <span className="theme-desc">{description}</span>
                </div>
                {theme === value && (
                  <span className="theme-check" aria-hidden="true">
                    <CheckCircle size={16} />
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </section>

        <section className="settings-card security-card" aria-labelledby="security-heading">
          <div className="card-header">
            <Shield size={20} aria-hidden="true" />
            <h2
              id="security-heading"
              className="settings-section-title settings-section-title-inline"
            >
              Security
            </h2>
          </div>
          <ul className="security-list">
            <li className="security-item">
              <CheckCircle size={15} aria-hidden="true" />
              <div>
                <span className="security-title">HttpOnly session cookies</span>
                <span className="security-desc">
                  Access and refresh tokens are never stored in localStorage.
                </span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} aria-hidden="true" />
              <div>
                <span className="security-title">Encrypted message storage</span>
                <span className="security-desc">
                  AES-256-GCM ciphertext is stored. Room keys are managed by the server, so this is
                  not end-to-end encryption.
                </span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} aria-hidden="true" />
              <div>
                <span className="security-title">Auto-deleting messages</span>
                <span className="security-desc">
                  MongoDB TTL indexes remove messages after the room timer.
                </span>
              </div>
            </li>
            <li className="security-item">
              <CheckCircle size={15} aria-hidden="true" />
              <div>
                <span className="security-title">Session revocation</span>
                <span className="security-desc">
                  Signing out or resetting a password invalidates existing sessions.
                </span>
              </div>
            </li>
          </ul>
        </section>

        <section className="settings-card" aria-labelledby="privacy-heading">
          <div className="card-header">
            <Lock size={20} aria-hidden="true" />
            <h2
              id="privacy-heading"
              className="settings-section-title settings-section-title-inline"
            >
              Privacy
            </h2>
          </div>
          <ul className="privacy-list">
            <li>
              <CheckCircle size={14} aria-hidden="true" /> Room-level access control
            </li>
            <li>
              <CheckCircle size={14} aria-hidden="true" /> Optional password-protected rooms
            </li>
            <li>
              <CheckCircle size={14} aria-hidden="true" /> No phone number required
            </li>
            <li>
              <CheckCircle size={14} aria-hidden="true" /> No third-party analytics
            </li>
          </ul>
        </section>

        <section className="settings-card about-card" aria-labelledby="about-heading">
          <h2 id="about-heading" className="settings-section-title">
            About
          </h2>
          <p className="about-desc">
            RelayChat is a single-service chat app. React, Express, MongoDB, and Socket.IO run
            together on one server.
          </p>
          <p className="about-version">Version 1.0.0</p>
        </section>
      </main>
    </div>
  );
}
