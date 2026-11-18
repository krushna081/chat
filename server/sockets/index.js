import mongoose from 'mongoose';
import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js';
import { isAllowedOrigin } from '../config/cors.js';
import { getAccessTokenFromSocket, verifyAccessToken } from '../utils/auth.js';
import { findMemberRoom, isParticipant } from '../utils/roomAccess.js';
import { getExpiryDate } from '../utils/messageExpiry.js';
import { validateMessagePayload } from '../controllers/chatController.js';

const MESSAGE_WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 20;

const setupSocketHandlers = (io) => {
  const onlineCounts = new Map();

  io.use(async (socket, next) => {
    const origin = socket.handshake?.headers?.origin;
    if (!isAllowedOrigin(origin)) return next(new Error('Origin not allowed'));

    const token = getAccessTokenFromSocket(socket);
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyAccessToken(token);
      if (decoded.type !== 'access') return next(new Error('Authentication required'));

      const user = await User.findById(decoded.sub).select(
        'tokenVersion isEmailVerified username avatar'
      );
      if (
        !user ||
        !user.isEmailVerified ||
        Number(user.tokenVersion || 0) !== Number(decoded.ver)
      ) {
        return next(new Error('Authentication required'));
      }

      socket.userId = String(user._id);
      socket.user = {
        username: user.username,
        avatar: user.avatar,
      };
      return next();
    } catch {
      return next(new Error('Authentication required'));
    }
  });

  io.on('connection', async (socket) => {
    socket.data.joinedRooms = new Set();
    socket.data.messageTimes = [];

    const userKey = String(socket.userId);
    const count = (onlineCounts.get(userKey) || 0) + 1;
    onlineCounts.set(userKey, count);
    if (count === 1) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: true }).catch(() => {});
    }

    const emitError = (message) => socket.emit('app_error', { message });

    socket.on('join_room', async (roomId) => {
      try {
        if (typeof roomId !== 'string') return emitError('Invalid room id');
        await findMemberRoom(roomId, socket.userId);
        await socket.join(roomId);
        socket.data.joinedRooms.add(roomId);
        socket.to(roomId).emit('user_joined', {
          userId: socket.userId,
          username: socket.user?.username,
          message: 'User joined the room',
        });
        socket.emit('room_joined', { roomId });
      } catch {
        emitError('You do not have access to this room');
      }
    });

    socket.on('leave_room', async (roomId) => {
      if (typeof roomId !== 'string') return;
      socket.data.joinedRooms.delete(roomId);
      await socket.leave(roomId);
    });

    socket.on('send_message', async (data) => {
      try {
        if (!validateMessagePayload(data)) {
          return emitError('Encrypted message payload is required');
        }

        const now = Date.now();
        const recent = socket.data.messageTimes.filter((time) => now - time < MESSAGE_WINDOW_MS);
        if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
          return emitError('You are sending messages too quickly');
        }
        recent.push(now);
        socket.data.messageTimes = recent;

        const room = await ChatRoom.findOne({
          roomId: data.roomId,
          participants: socket.userId,
        }).select('messageExpiry');

        if (!room) return emitError('You do not have access to this room');

        const message = await Message.create({
          roomId: data.roomId,
          senderId: socket.userId,
          encryptedMessage: data.encryptedMessage,
          iv: data.iv,
          deliveryStatus: 'delivered',
          expiresAt: getExpiryDate(room.messageExpiry),
        });

        await ChatRoom.updateOne({ _id: room._id }, { $set: { lastActivity: new Date() } });

        io.to(data.roomId).emit('receive_message', {
          _id: message._id,
          roomId: message.roomId,
          senderId: String(message.senderId),
          senderName: socket.user?.username || 'Unknown',
          senderAvatar: socket.user?.avatar || null,
          encryptedMessage: message.encryptedMessage,
          iv: message.iv,
          deliveryStatus: message.deliveryStatus,
          createdAt: message.createdAt,
          expiresAt: message.expiresAt,
        });
      } catch {
        emitError('Failed to send message');
      }
    });

    socket.on('typing', (roomId) => {
      if (typeof roomId !== 'string' || !socket.data.joinedRooms.has(roomId)) return;
      socket.to(roomId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', (roomId) => {
      if (typeof roomId !== 'string' || !socket.data.joinedRooms.has(roomId)) return;
      socket.to(roomId).emit('user_stopped_typing', { userId: socket.userId });
    });

    socket.on('message_read', async (data) => {
      try {
        const messageId = data?.messageId;
        if (!mongoose.isValidObjectId(messageId)) return;

        const message = await Message.findById(messageId).select('roomId');
        if (!message) return;

        const room = await ChatRoom.findOne({ roomId: message.roomId });
        if (!room || !isParticipant(room, socket.userId)) return;

        await Message.updateOne({ _id: message._id }, { deliveryStatus: 'read' });
        io.to(message.roomId).emit('message_read', {
          messageId: String(message._id),
          userId: socket.userId,
        });
      } catch {
        // Ignore malformed read receipts.
      }
    });

    socket.on('disconnect', async () => {
      const remaining = (onlineCounts.get(userKey) || 1) - 1;
      if (remaining <= 0) {
        onlineCounts.delete(userKey);
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        }).catch(() => {});
      } else {
        onlineCounts.set(userKey, remaining);
      }
    });
  });
};

export default setupSocketHandlers;
