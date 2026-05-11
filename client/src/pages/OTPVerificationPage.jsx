import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@/styles/OTPVerificationPage.css';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authAPI } from '@/services/api';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const { verifyOTP } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const username = location.state?.username || '';
  const password = location.state?.password || '';

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const chars = pasted.split('');
      const newOtp = [...otp];
      chars.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex(v => !v);
      inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otpString, username, password);
      toast.success('Email verified! Welcome to SecureChat');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
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
      toast.success('OTP resent to your email');
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return (
      <div className="otp-page">
        <div className="otp-container">
          <p className="otp-error">No email provided</p>
          <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '10px 24px' }}>
            Back to Signup
          </button>
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
        <div className="otp-icon">
          <Lock size={32} />
        </div>
        <h1 className="otp-title">Verify your email</h1>
        <p className="otp-desc">
          Enter the 6-digit code sent to<br />
          <strong>{email}</strong>
        </p>

        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              maxLength={1}
              className="otp-digit"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileFocus={{ scale: 1.08 }}
            />
          ))}
        </div>

        <div className="otp-timer">
          {canResend ? (
            <span className="timer-expired">Code expired</span>
          ) : (
            <>Code expires in <strong>{formatTime(timeLeft)}</strong></>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.some(d => !d)}
          className="otp-verify-btn"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
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