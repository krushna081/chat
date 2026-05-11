import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const chatRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    roomKey: {
      type: String,
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messageExpiry: {
      type: String,
      enum: ['1h', '24h', '3d', '1w', 'permanent'],
      default: '24h',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash room password before saving (if provided)
chatRoomSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('ChatRoom', chatRoomSchema);
