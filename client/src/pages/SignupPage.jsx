import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, MessageCircle, User } from 'lucide-react';
import {
  PASSWORD_REQUIREMENTS,
  isStrongPassword,
  isValidEmail,
  isValidUsername,
} from '@/utils/validation';
import '@/styles/SignupPage.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signup = useAuthStore((state) => state.signup);
  const resetLoading = useAuthStore((state) => state.resetLoading);
  const navigate = useNavigate();

  useEffect(() => () => resetLoading(), [resetLoading]);

  const requirements = useMemo(
    () => [
      { label: 'At least 8 characters', met: formData.password.length >= 8 },
      { label: 'Uppercase letter', met: /[A-Z]/.test(formData.password) },
      { label: 'Lowercase letter', met: /[a-z]/.test(formData.password) },
      { label: 'Number', met: /\d/.test(formData.password) },
      { label: 'Symbol', met: /[^A-Za-z0-9]/.test(formData.password) },
    ],
    [formData.password]
  );

  const isFormValid = useMemo(
    () =>
      isValidUsername(formData.username) &&
      isValidEmail(formData.email) &&
      isStrongPassword(formData.password) &&
      formData.password === formData.confirmPassword,
    [formData]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    if (!isStrongPassword(formData.password)) {
      toast.error(PASSWORD_REQUIREMENTS);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.username.trim(), formData.email.trim(), formData.password);
      toast.success('Check your email for a verification code');
      navigate('/verify-otp', {
        state: { email: formData.email.trim(), username: formData.username.trim() },
      });
    } catch (error) {
      toast.error(error.message || 'Sign up failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" aria-hidden="true" />
      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="auth-header">
            <Link to="/" className="auth-logo" aria-label="RelayChat home">
              <MessageCircle size={26} />
            </Link>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join RelayChat and start a conversation.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-username">
                Username
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="signup-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="input-primary"
                  autoComplete="username"
                  minLength={3}
                  maxLength={24}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-primary"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="input-primary"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="input-suffix"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm-password">
                Confirm password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="signup-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input-primary"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((visible) => !visible)}
                  className="input-suffix"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {formData.password.length > 0 && (
              <div className="password-requirements" aria-live="polite">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className={`requirement ${requirement.met ? 'met' : ''}`}
                  >
                    <CheckCircle size={14} aria-hidden="true" />
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="auth-submit-btn"
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </motion.button>
          </form>

          <div className="auth-footer">
            <p className="footer-text">
              Already have an account?{' '}
              <Link to="/login" className="footer-link">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
