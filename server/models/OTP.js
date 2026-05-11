import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format'],
    },
    type: {
      type: String,
      enum: ['verification', 'password_reset'],
      default: 'verification',
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries and auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, type: 1 });

export default mongoose.model('OTP', otpSchema);
