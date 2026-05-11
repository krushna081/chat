import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import '@/styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const { login, forgotPasswordRequest, verifyResetOTP, resetLoading } = useAuthStore();
  const navigate = useNavigate();

  // Reset loading state on mount/unmount
  useEffect(() => {
    return () => {
      resetLoading();
    };
  }, [resetLoading]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const emailValid = email.trim().length > 0 && email.includes('@');
    const passwordValid = password.length >= 1;
    return emailValid && passwordValid;
  }, [email, password]);

  // Reset submitting state when user types
  useEffect(() => {
    if (isSubmitting) {
      setIsSubmitting(false);
    }
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      const result = await forgotPasswordRequest(forgotEmail);
      setMaskedEmail(result.email || forgotEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
      setForgotStep(2);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOTP = async (e) => {
    e.preventDefault();
    
    const otpValue = resetOtp.trim();
    const passwordValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();

    if (!otpValue || otpValue.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    if (!passwordValue || passwordValue.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordValue !== confirmValue) {
      toast.error('Passwords do not match');
      return;
    }

    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecial = /[@$!%*?&]/.test(passwordValue);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setForgotLoading(true);
    try {
      await verifyResetOTP(forgotEmail, otpValue, passwordValue);
      toast.success('Password reset successful! Please login with your new password.');
      setForgotStep(0);
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setForgotLoading(true);
    try {
      await forgotPasswordRequest(forgotEmail);
      toast.success('OTP resent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: OTP + New Password
  if (forgotStep === 2) {
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
            <button 
              onClick={() => { setForgotStep(1); setResetOtp(''); }} 
              className="forgot-back-btn"
            >
              <ArrowLeft size={18} /> Back
            </button>
            
            <div className="auth-header">
              <div className="auth-logo">🔒</div>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter the OTP sent to {maskedEmail}</p>
            </div>

            <form onSubmit={handleVerifyResetOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <div className="input-wrapper">
                  <Shield size={18} className="input-icon" />
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="input-primary"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="input-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="input-suffix"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="input-hint">Min 8 chars, uppercase, lowercase, number, special</p>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="input-primary"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                className="resend-otp-link"
                disabled={forgotLoading}
              >
                Didn't receive OTP? Resend
              </button>

              <motion.button
                type="submit"
                disabled={forgotLoading}
                className="auth-submit-btn"
                whileHover={{ scale: forgotLoading ? 1 : 1.01 }}
                whileTap={{ scale: forgotLoading ? 1 : 0.99 }}
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Resetting...
                  </span>
                ) : 'Reset Password'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 1: Enter email
  if (forgotStep === 1) {
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
            <button 
              onClick={() => setForgotStep(0)} 
              className="forgot-back-btn"
            >
              <ArrowLeft size={18} /> Back to login
            </button>
            
            <div className="auth-header">
              <div className="auth-logo">🔒</div>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter your email to receive an OTP</p>
            </div>

            <form onSubmit={handleForgotPasswordRequest} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-primary"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={forgotLoading || !forgotEmail.trim()}
                className="auth-submit-btn"
                whileHover={{ scale: forgotLoading ? 1 : 1.01 }}
                whileTap={{ scale: forgotLoading ? 1 : 0.99 }}
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Sending OTP...
                  </span>
                ) : 'Send OTP'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main login form
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
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your secure chat</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-primary"
                  autoComplete="current-password"
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

            <button
              type="button"
              onClick={() => setForgotStep(1)}
              className="forgot-password-link"
            >
              Forgot password?
            </button>

            <motion.button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="auth-submit-btn"
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Signing in...
                </span>
              ) : 'Sign in'}
            </motion.button>
          </form>

          <div className="auth-footer">
            <p className="footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="footer-link">Create one</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}