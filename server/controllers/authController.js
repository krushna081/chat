import User from '../models/User.js';
import OTP from '../models/OTP.js';
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  generateTokens,
  verifyRefreshToken,
  validatePassword,
} from '../utils/auth.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // Save OTP
    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
      },
      { upsert: true }
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    // Store signup data temporarily (in real app, use session or cache)
    res.status(200).json({
      success: true,
      message: 'OTP sent to email',
      tempData: { username, email, password },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtpAndCreateUser = async (req, res) => {
  try {
    const { email, otp, username, password } = req.body;

    if (!email || !otp || !username || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum attempts exceeded' });
    }

    // Verify OTP
    const isOtpValid = await verifyOTP(otp, otpRecord.hashedOtp);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Create user
    const newUser = new User({
      username,
      email,
      password,
      isEmailVerified: true,
    });

    await newUser.save();

    // Delete OTP record
    await OTP.deleteOne({ email });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser._id);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email not verified' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken: newAccessToken } = generateTokens(decoded.id);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await OTP.findOneAndUpdate(
      { email },
      {
        hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
      { upsert: true }
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP resent' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// OTP-based Password Reset - Step 1: Request OTP
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists, an OTP will be sent' 
      });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await OTP.findOneAndUpdate(
      { email, type: 'password_reset' },
      {
        email,
        hashedOtp,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
      { upsert: true }
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ 
      success: true, 
      message: 'If an account exists, an OTP will be sent',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (error) {
    console.error('Forgot password request error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// OTP-based Password Reset - Step 2: Verify OTP
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character',
      });
    }

    const otpRecord = await OTP.findOne({ email, type: 'password_reset' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum attempts exceeded' });
    }

    const isOtpValid = await verifyOTP(otp, otpRecord.hashedOtp);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ email, type: 'password_reset' });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character',
      });
    }

    let decoded;
    try {
      const jwt = await import('jsonwebtoken');
      decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
