import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    encryptedMessage: {
      type: String,
      required: true,
      match: [/^[a-f0-9]+$/, 'Invalid encrypted message'],
      maxlength: [131_072, 'Encrypted message is too large'],
    },
    iv: {
      type: String,
      required: true,
      match: [/^[a-f0-9]{24}$/, 'Invalid initialization vector'],
    },
    // Legacy field. New messages must never store plaintext.
    message: {
      type: String,
      select: false,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Message', messageSchema);
