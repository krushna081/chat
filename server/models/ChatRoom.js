import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { isValidImage } from '../utils/validation.js';

const chatRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      match: [/^[a-f0-9]{16}$/, 'Invalid room id'],
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    roomPicture: {
      type: String,
      default: null,
      validate: {
        // Allow legacy uploads up to 2 MB when saving older rooms; new uploads are limited by the controller.
        validator: (value) => isValidImage(value, 2 * 1024 * 1024),
        message: 'Room picture must be an HTTPS URL or a supported image',
      },
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      index: true,
    },
    roomKey: {
      type: String,
      required: true,
      select: false,
      match: [/^[a-f0-9]{64}$/, 'Invalid room key'],
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
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

chatRoomSchema.pre('validate', function normalizeLegacyRoomPicture() {
  if (this.roomPicture && !isValidImage(this.roomPicture, 2 * 1024 * 1024)) {
    this.roomPicture = null;
  }
});

chatRoomSchema.pre('save', async function hashRoomPassword() {
  if (!this.isModified('password')) return;
  this.isPrivate = Boolean(this.password);
  if (!this.password) return;
  this.password = await bcryptjs.hash(this.password, 12);
});

chatRoomSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return Promise.resolve(true);
  return bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model('ChatRoom', chatRoomSchema);
