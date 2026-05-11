import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

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
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
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
      enum: ['dark', 'blue', 'white'],
      default: 'dark',
    },
    notificationMuted: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ChatRoom',
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.googleId;
  return user;
};

export default mongoose.model('User', userSchema);
