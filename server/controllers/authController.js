import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  clearAuthCookies,
  generateOTP,
  getRefreshTokenFromRequest,
  hashOTP,
  setAuthCookies,
  verifyOTP,
  verifyRefreshToken,
} from '../utils/auth.js';
import {
  PASSWORD_REQUIREMENTS,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
} from '../utils/validation.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const DUMMY_HASH_PROMISE = bcryptjs.hash('relaychat-dummy-password', 12);

// Existing accounts may predate email normalization; match them case-insensitively.
const EMAIL_COLLATION = { locale: 'en', strength: 2 };
const findUserByEmail = (email, select) => {
  const query = User.findOne({ email }).collation(EMAIL_COLLATION);
  return select ? query.select(select) : query;
};

const genericCodeResponse = {
  success: true,
  message: 'If the details are available, a verification code has been sent',
};

const disconnectUserSockets = async (req, userId) => {
  const io = req.app.get('io');
  if (!io) return;
  const sockets = await io.fetchSockets();
  sockets
    .filter((socket) => String(socket.userId) === String(userId))
    .forEach((socket) => socket.disconnect(true));
};

const saveOtp = async (email, type) => {
  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  await OTP.findOneAndUpdate(
    { email, type },
    {
      $set: {
        hashedOtp,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        maxAttempts: MAX_OTP_ATTEMPTS,
      },
      $setOnInsert: { email, type },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return otp;
};

export const signup = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const username = normalizeUsername(req.body?.username);
  const password = req.body?.password;

  if (!isValidEmail(email) || !isValidUsername(username)) {
    throw new AppError(400, 'Enter a valid username and email address');
  }
  if (!isValidPassword(password)) {
    throw new AppError(400, PASSWORD_REQUIREMENTS);
  }

  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail(email, '_id').lean(),
    User.findOne({ username }).select('_id').lean(),
  ]);
  if (existingEmail || existingUsername) {
    // Do not reveal whether an account or username already exists.
    return res.status(200).json(genericCodeResponse);
  }

  const otp = await saveOtp(email, 'verification');
  try {
    await sendOtpEmail(email, otp, 'verification');
  } catch (error) {
    // Keep the response generic so email delivery failures cannot enumerate accounts.
    console.error(`[auth] Verification email failed: ${error.message}`);
  }
  return res.status(200).json(genericCodeResponse);
});

export const verifyOtpAndCreateUser = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const username = normalizeUsername(req.body?.username);
  const otp = String(req.body?.otp || '').trim();
  const password = req.body?.password;

  if (!isValidEmail(email) || !isValidUsername(username)) {
    throw new AppError(400, 'Enter a valid username and email address');
  }
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError(400, 'Enter the 6-digit verification code');
  }
  if (!isValidPassword(password)) {
    throw new AppError(400, PASSWORD_REQUIREMENTS);
  }

  const otpRecord = await OTP.findOne({ email, type: 'verification' }).select('+hashedOtp');
  if (!otpRecord || !otpRecord.expiresAt || otpRecord.expiresAt.getTime() <= Date.now()) {
    if (otpRecord) await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError(400, 'Verification code expired or not found');
  }
  const maxAttempts = Number(otpRecord.maxAttempts || 5);
  if (Number(otpRecord.attempts || 0) >= maxAttempts) {
    throw new AppError(429, 'Too many incorrect attempts. Request a new code.');
  }

  // Claim an attempt atomically so concurrent guesses cannot exceed maxAttempts.
  const claimed = await OTP.findOneAndUpdate(
    {
      _id: otpRecord._id,
      expiresAt: { $gt: new Date() },
      $or: [{ attempts: { $lt: maxAttempts } }, { attempts: { $exists: false } }],
    },
    { $inc: { attempts: 1 } }
  );
  if (!claimed) {
    throw new AppError(400, 'Verification code expired or not found');
  }

  const otpIsValid = await verifyOTP(otp, otpRecord.hashedOtp);
  if (!otpIsValid) {
    throw new AppError(400, 'Invalid verification code');
  }

  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail(email, '_id').lean(),
    User.findOne({ username }).select('_id').lean(),
  ]);
  if (existingEmail || existingUsername) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError(409, 'An account with those details already exists');
  }

  const user = await User.create({
    username,
    email,
    password,
    isEmailVerified: true,
  });

  await OTP.deleteOne({ _id: otpRecord._id });
  setAuthCookies(res, user);

  return res.status(201).json({
    success: true,
    message: 'Account created',
    user: user.toJSON(),
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (
    !isValidEmail(email) ||
    typeof password !== 'string' ||
    password.length === 0 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await findUserByEmail(email, '+password +failedLoginAttempts +lockUntil');

  if (!user) {
    const dummyHash = await DUMMY_HASH_PROMISE;
    await bcryptjs.compare(password, dummyHash);
    throw new AppError(401, 'Invalid email or password');
  }

  const passwordIsCorrect = await user.comparePassword(password);

  if (user.isLocked()) {
    throw new AppError(429, 'Too many failed attempts. Try again later.');
  }

  if (!passwordIsCorrect) {
    await user.registerFailedLogin();
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw new AppError(403, 'Verify your email before signing in');
  }

  await user.resetLoginFailures();
  setAuthCookies(res, user);

  return res.status(200).json({
    success: true,
    message: 'Signed in',
    user: user.toJSON(),
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    throw new AppError(401, 'Session expired');
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    clearAuthCookies(res);
    throw new AppError(401, 'Session expired');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isEmailVerified || Number(user.tokenVersion || 0) !== Number(decoded.ver)) {
    clearAuthCookies(res);
    throw new AppError(401, 'Session expired');
  }

  setAuthCookies(res, user);
  return res.status(200).json({
    success: true,
    message: 'Session refreshed',
    user: user.toJSON(),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  let userId = null;
  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded) {
      userId = decoded.sub;
      await User.updateOne(
        {
          _id: decoded.sub,
          $or: [{ tokenVersion: decoded.ver }, { tokenVersion: { $exists: false } }],
        },
        { $inc: { tokenVersion: 1 } }
      );
    }
  }

  if (userId) {
    await disconnectUserSockets(req, userId).catch(() => {});
  }

  clearAuthCookies(res);
  return res.status(200).json({ success: true, message: 'Signed out' });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.status(200).json(genericCodeResponse);
  }

  const existingUser = await findUserByEmail(email, 'isEmailVerified').lean();
  if (existingUser?.isEmailVerified) {
    return res.status(200).json(genericCodeResponse);
  }

  const otp = await saveOtp(email, 'verification');
  try {
    await sendOtpEmail(email, otp, 'verification');
  } catch (error) {
    // Keep the response generic so email delivery failures cannot enumerate accounts.
    console.error(`[auth] Verification email failed: ${error.message}`);
  }
  return res.status(200).json(genericCodeResponse);
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const genericResponse = {
    success: true,
    message: 'If an account exists, a password reset code has been sent',
  };

  if (!isValidEmail(email)) {
    return res.status(200).json(genericResponse);
  }

  const user = await findUserByEmail(email, '_id').lean();
  if (!user) {
    return res.status(200).json(genericResponse);
  }

  try {
    const otp = await saveOtp(email, 'password_reset');
    await sendOtpEmail(email, otp, 'password_reset');
  } catch (error) {
    console.error(`[auth] Password reset email failed: ${error.message}`);
  }

  return res.status(200).json(genericResponse);
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || '').trim();
  const newPassword = req.body?.newPassword;

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    throw new AppError(400, 'Enter a valid email and 6-digit code');
  }
  if (!isValidPassword(newPassword)) {
    throw new AppError(400, PASSWORD_REQUIREMENTS);
  }

  const otpRecord = await OTP.findOne({ email, type: 'password_reset' }).select('+hashedOtp');
  if (!otpRecord || !otpRecord.expiresAt || otpRecord.expiresAt.getTime() <= Date.now()) {
    if (otpRecord) await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError(400, 'Reset code expired or not found');
  }
  const maxAttempts = Number(otpRecord.maxAttempts || 5);
  if (Number(otpRecord.attempts || 0) >= maxAttempts) {
    throw new AppError(429, 'Too many incorrect attempts. Request a new code.');
  }

  // Claim an attempt atomically so concurrent guesses cannot exceed maxAttempts.
  const claimed = await OTP.findOneAndUpdate(
    {
      _id: otpRecord._id,
      expiresAt: { $gt: new Date() },
      $or: [{ attempts: { $lt: maxAttempts } }, { attempts: { $exists: false } }],
    },
    { $inc: { attempts: 1 } }
  );
  if (!claimed) {
    throw new AppError(400, 'Reset code expired or not found');
  }

  const otpIsValid = await verifyOTP(otp, otpRecord.hashedOtp);
  if (!otpIsValid) {
    throw new AppError(400, 'Invalid reset code');
  }

  const user = await findUserByEmail(email, '+failedLoginAttempts +lockUntil');
  if (!user) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw new AppError(400, 'Unable to reset this account');
  }

  user.password = newPassword;
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();
  await OTP.deleteOne({ _id: otpRecord._id });
  await disconnectUserSockets(req, user._id).catch(() => {});
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: 'Password reset. Sign in with your new password.',
  });
});
