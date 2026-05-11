import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import '@/styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState(0); // 0: show link, 1: enter email, 2: enter OTP + new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const { login, forgotPasswordRequest, verifyResetOTP, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
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
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOTP = async (e) => {
    e.preventDefault();
    
    const otpValue = resetOtp.trim();
    const passwordValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();

    if (!otpValue) {
      toast.error('Please enter the OTP');
      return;
    }
    if (otpValue.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    if (!passwordValue) {
      toast.error('Please enter a new password');
      return;
    }
    if (passwordValue !== confirmValue) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordValue.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Check password requirements
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecial = /[@$!%*?&]/.test(passwordValue);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setForgotLoading(true);
    console.log('Sending reset request:', { email: forgotEmail, otp: otpValue, passwordProvided: !!passwordValue });
    
    try {
      const result = await verifyResetOTP(forgotEmail, otpValue, passwordValue);
      console.log('Reset result:', result);
      toast.success('Password reset successful! Please login with your new password.');
      setForgotStep(0);
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
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
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Enter OTP and new password
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
              <div className="auth-logo">&#128274;</div>
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
                    required
                    autoComplete="one-time-code"
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
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="input-suffix"
                    tabIndex={-1}
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
                    required
                    autoComplete="new-password"
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {forgotLoading ? 'Resetting...' : 'Reset Password'}
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
              <div className="auth-logo">&#128274;</div>
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
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={forgotLoading}
                className="auth-submit-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-primary"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-suffix"
                  tabIndex={-1}
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
              disabled={loading}
              className="auth-submit-btn"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
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