import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import env from '../config/env.js';
import { isValidImage } from '../utils/validation.js';

const FAILED_LOGIN_LIMIT = env.maxLoginAttempts;
const LOCK_DURATION_MS = env.loginLockMinutes * 60 * 1000;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email is too long'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
      validate: {
        // Allow legacy uploads up to 2 MB when saving older accounts; new uploads are limited by the controller.
        validator: (value) => isValidImage(value, 2 * 1024 * 1024),
        message: 'Avatar must be an HTTPS URL or a supported image',
      },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    notificationMuted: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ChatRoom',
      default: [],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// Normalize legacy theme names before validation so older accounts can still save.
userSchema.pre('validate', function normalizeLegacyProfile() {
  if (!['dark', 'light'].includes(this.theme)) {
    this.theme = this.theme === 'white' ? 'light' : 'dark';
  }
  // Older versions accepted broader image values. Drop unsupported legacy values instead of
  // blocking account updates such as password resets.
  if (this.avatar && !isValidImage(this.avatar, 2 * 1024 * 1024)) {
    this.avatar = null;
  }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcryptjs.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return Promise.resolve(false);
  return bcryptjs.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  this.failedLoginAttempts = Number(this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= FAILED_LOGIN_LIMIT) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

userSchema.methods.resetLoginFailures = async function resetLoginFailures() {
  if (!this.failedLoginAttempts && !this.lockUntil) return;
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.failedLoginAttempts;
  delete user.lockUntil;
  delete user.tokenVersion;
  delete user.__v;
  return user;
};

export default mongoose.model('User', userSchema);
