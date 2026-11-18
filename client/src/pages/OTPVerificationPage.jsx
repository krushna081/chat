import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/context/store';
import { authAPI } from '@/services/api';
import { PASSWORD_REQUIREMENTS, isStrongPassword } from '@/utils/validation';
import '@/styles/OTPVerificationPage.css';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const verifyOTP = useAuthStore((state) => state.verifyOTP);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const username = location.state?.username || '';

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return undefined;
    }
    const timer = setTimeout(() => setTimeLeft((remaining) => remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextOtp = [...otp];
    pasted.split('').forEach((character, index) => {
      nextOtp[index] = character;
    });
    setOtp(nextOtp);
    const nextEmpty = nextOtp.findIndex((value) => !value);
    inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Enter all 6 digits');
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error(PASSWORD_REQUIREMENTS);
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otpString, username, password);
      toast.success('Email verified. Welcome to RelayChat.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.resendOTP({ email });
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setCanResend(false);
      toast.success('If the signup is still pending, a new code was sent');
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend the code');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!email || !username) {
    return (
      <div className="otp-page">
        <div className="otp-container">
          <p className="otp-error">Start a signup before verifying an email.</p>
          <Link to="/signup" className="btn-primary otp-inline-link">
            Back to signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-page">
      <motion.div
        className="otp-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="otp-icon" aria-hidden="true">
          <MessageCircle size={30} />
        </div>
        <h1 className="otp-title">Verify your email</h1>
        <p className="otp-desc">
          Enter the 6-digit code sent to
          <br />
          <strong>{email}</strong>
        </p>

        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              maxLength={1}
              className="otp-digit"
              aria-label={`Verification digit ${index + 1}`}
              autoComplete="one-time-code"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileFocus={{ scale: 1.08 }}
            />
          ))}
        </div>

        <div className="otp-password-group">
          <label className="otp-label" htmlFor="otp-password">
            Password
          </label>
          <div className="otp-password-wrapper">
            <Lock size={17} aria-hidden="true" />
            <input
              id="otp-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="otp-password-input"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="otp-hint">{PASSWORD_REQUIREMENTS}</p>
        </div>

        <div className="otp-timer" aria-live="polite">
          {canResend ? (
            <span className="timer-expired">Code expired</span>
          ) : (
            <>
              Code expires in <strong>{formatTime(timeLeft)}</strong>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || otp.some((digit) => !digit) || !password}
          className="otp-verify-btn"
        >
          {loading ? (
            <span className="otp-loading">
              <Loader2 className="animate-spin" size={17} /> Verifying…
            </span>
          ) : (
            'Verify and create account'
          )}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className="otp-resend-btn"
        >
          {canResend ? 'Resend code' : `Resend in ${formatTime(timeLeft)}`}
        </button>
      </motion.div>
    </div>
  );
}
