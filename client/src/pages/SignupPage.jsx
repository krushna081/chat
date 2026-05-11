import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, resetLoading } = useAuthStore();
  const navigate = useNavigate();

  // Reset loading state on mount/unmount
  useEffect(() => {
    return () => {
      resetLoading();
    };
  }, [resetLoading]);

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

  // Reset submitting state when user types
  useEffect(() => {
    if (isSubmitting) {
      setIsSubmitting(false);
    }
  }, [formData.username, formData.email, formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const usernameValid = formData.username.trim().length >= 3;
    const emailValid = formData.email.trim().includes('@');
    const passwordValid = formData.password.length >= 8;
    const confirmValid = formData.confirmPassword === formData.password && formData.confirmPassword.length > 0;
    return usernameValid && emailValid && passwordValid && confirmValid;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid || isSubmitting) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error('Password does not meet security requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData.username, formData.email, formData.password);
      toast.success('Signup successful! Check your email for OTP');
      navigate('/verify-otp', {
        state: { email: formData.email, username: formData.username, password: formData.password },
      });
    } catch (error) {
      toast.error(error.message || 'Signup failed');
      setIsSubmitting(false);
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
            <div className="auth-logo">🔒</div>
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
                  autoComplete="username"
                  minLength={3}
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
                  placeholder="Create a password"
                  className="input-primary"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-suffix"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="input-suffix"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {formData.password.length > 0 && (
              <div className="password-requirements">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`requirement ${req.met ? 'met' : ''}`}
                  >
                    <CheckCircle size={14} />
                    <span>{req.label}</span>
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
                  <Loader2 className="animate-spin" size={18} /> Creating account...
                </span>
              ) : 'Create Account'}
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