import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signup, loading } = useAuthStore();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const strength = {
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd),
      isLongEnough: pwd.length >= 8,
    };

    const score = Object.values(strength).filter(Boolean).length;
    setPasswordStrength(score);
    return score === 5;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error('Password does not meet security requirements');
      return;
    }

    try {
      await signup(formData.username, formData.email, formData.password);
      toast.success('Signup successful! Check your email for OTP');
      navigate('/verify-otp', {
        state: { email: formData.email, username: formData.username, password: formData.password },
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const requirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Number', met: /\d/.test(formData.password) },
    { label: 'Special character', met: /[@$!%*?&]/.test(formData.password) },
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" />
      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="auth-header">
            <div className="auth-logo">&#128274;</div>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join SecureChat for encrypted messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="input-primary"
                  minLength={3}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-primary"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="input-primary"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-suffix" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="strength-bar">
                <div className="strength-segments">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`strength-segment ${i < passwordStrength ? 'filled' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="requirements-list">
                {requirements.map((req, idx) => (
                  <div key={idx} className={`requirement ${req.met ? 'met' : ''}`}>
                    <CheckCircle size={13} />
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input-primary"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="input-suffix" tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || passwordStrength < 5}
              className="auth-submit-btn"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </motion.button>
          </form>

          <div className="auth-footer">
            <p className="footer-text">
              Already have an account?{' '}
              <Link to="/login" className="footer-link">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}