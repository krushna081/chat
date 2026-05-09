import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@/styles/OTPVerificationPage.css';
import { useAuthStore } from '@/context/store';
import toast from 'react-hot-toast';
import { Lock, RotateCcw } from 'lucide-react';
import { authAPI } from '@/services/api';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const { verifyOTP } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const username = location.state?.username || '';
  const password = location.state?.password || '';

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleBackspace = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authAPI.resendOTP({ email });
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setCanResend(false);
      toast.success('OTP resent to your email');
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">No email provided</p>
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary px-6 py-2"
          >
            Back to Signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-page min-h-screen bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-dark p-8 rounded-2xl space-y-8">
          <div className="text-center">
            <Lock size={48} className="text-cyber-100 mx-auto mb-4" />
            <h1 className="text-4xl font-bold cyber-glow mb-2">Verify Email</h1>
            <p className="text-gray-400">
              Enter the 6-digit code sent to<br />
              <span className="text-cyber-100 font-semibold">{email}</span>
            </p>
          </div>

          {/* OTP Input Boxes */}
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleBackspace(index, e)}
                  maxLength={1}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-cyber-100 rounded-lg bg-transparent text-cyber-100 focus:outline-none focus:border-cyber-200 focus:ring-2 focus:ring-cyber-100 focus:ring-opacity-50"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  whileFocus={{ scale: 1.1 }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                {canResend ? (
                  <span className="text-red-500">Code expired</span>
                ) : (
                  <>
                    Code expires in:{' '}
                    <span className="text-cyber-100 font-bold">{formatTime(timeLeft)}</span>
                  </>
                )}
              </p>
            </div>

            {/* Verify Button */}
            <motion.button
              onClick={handleVerify}
              disabled={loading || otp.some((digit) => !digit)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </motion.button>

            {/* Resend Button */}
            <motion.button
              onClick={handleResendOtp}
              disabled={!canResend}
              whileHover={{ scale: canResend ? 1.02 : 1 }}
              className="w-full btn-secondary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw size={18} />
              {canResend ? 'Resend OTP' : 'Resend available in ' + formatTime(timeLeft)}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
