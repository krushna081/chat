import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, MessageCircle, Shield } from 'lucide-react';
import { PASSWORD_REQUIREMENTS, isStrongPassword, isValidEmail } from '@/utils/validation';
import '@/styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forgotStep, setForgotStep] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, forgotPasswordRequest, verifyResetOTP, resetLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => () => resetLoading(), [resetLoading]);

  const isFormValid = useMemo(() => isValidEmail(email) && password.length > 0, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Signed in');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Sign in failed');
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordRequest = async (event) => {
    event.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setForgotLoading(true);
    try {
      await forgotPasswordRequest(forgotEmail.trim());
      setForgotStep(2);
      toast.success('If an account exists, a reset code was sent');
    } catch (error) {
      toast.error(error.message || 'Could not request a reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOTP = async (event) => {
    event.preventDefault();
    const otpValue = resetOtp.trim();

    if (!/^\d{6}$/.test(otpValue)) {
      toast.error('Enter the 6-digit reset code');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_REQUIREMENTS);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    try {
      await verifyResetOTP(forgotEmail.trim(), otpValue, newPassword);
      toast.success('Password reset. Sign in with your new password.');
      setForgotStep(0);
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message || 'Could not reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setForgotLoading(true);
    try {
      await forgotPasswordRequest(forgotEmail.trim());
      toast.success('If an account exists, a new reset code was sent');
    } catch (error) {
      toast.error(error.message || 'Could not resend the reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  if (forgotStep === 2) {
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
            <button
              type="button"
              onClick={() => {
                setForgotStep(1);
                setResetOtp('');
              }}
              className="forgot-back-btn"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="auth-header">
              <div className="auth-logo" aria-hidden="true">
                <MessageCircle size={26} />
              </div>
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">
                Enter the code sent to <strong>{forgotEmail}</strong> and choose a new password.
              </p>
            </div>

            <form onSubmit={handleVerifyResetOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reset-otp">
                  Reset code
                </label>
                <div className="input-wrapper">
                  <Shield size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="reset-otp"
                    type="text"
                    value={resetOtp}
                    onChange={(event) =>
                      setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="input-primary"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New password
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    className="input-primary"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    className="input-suffix"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="input-hint">{PASSWORD_REQUIREMENTS}</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-new-password">
                  Confirm password
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="confirm-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    className="input-primary"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                className="resend-otp-link"
                disabled={forgotLoading}
              >
                Didn’t receive a code? Resend
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
                    <Loader2 className="animate-spin" size={18} /> Resetting…
                  </span>
                ) : (
                  'Reset password'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  if (forgotStep === 1) {
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
            <button type="button" onClick={() => setForgotStep(0)} className="forgot-back-btn">
              <ArrowLeft size={18} /> Back to sign in
            </button>

            <div className="auth-header">
              <div className="auth-logo" aria-hidden="true">
                <MessageCircle size={26} />
              </div>
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">Enter your email to receive a reset code.</p>
            </div>

            <form onSubmit={handleForgotPasswordRequest} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Email
                </label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" aria-hidden="true" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="input-primary"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={forgotLoading || !isValidEmail(forgotEmail)}
                className="auth-submit-btn"
                whileHover={{ scale: forgotLoading ? 1 : 1.01 }}
                whileTap={{ scale: forgotLoading ? 1 : 0.99 }}
              >
                {forgotLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Sending…
                  </span>
                ) : (
                  'Send reset code'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

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
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your RelayChat rooms.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-primary"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="input-primary"
                  autoComplete="current-password"
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

            <button type="button" onClick={() => setForgotStep(1)} className="forgot-password-link">
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
                  <Loader2 className="animate-spin" size={18} /> Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          <div className="auth-footer">
            <p className="footer-text">
              Don’t have an account?{' '}
              <Link to="/signup" className="footer-link">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
