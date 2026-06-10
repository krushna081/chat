import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ User ${socket.userId} connected`);

    // Update user online status
    try {
      await User.findByIdAndUpdate(socket.userId, { isOnline: true });
    } catch (err) {
      console.error('Failed to update online status:', err.message);
    }

    socket.on('join_room', async (roomId) => {
      try {
        socket.join(roomId);
        const room = await ChatRoom.findOne({ roomId });

        io.to(roomId).emit('user_joined', {
          userId: socket.userId,
          message: 'User joined the room',
        });

        console.log(`👤 User ${socket.userId} joined room ${roomId}`);
      } catch (err) {
        console.error('Join room error:', err.message);
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const { roomId, encryptedMessage, iv, message: plainMessage } = data;

        // Calculate expiry based on room settings
        const room = await ChatRoom.findOne({ roomId });
        const expiryHours = parseInt(room.messageExpiry);
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        // Save message
        const message = new Message({
          roomId,
          senderId: socket.userId,
          encryptedMessage: encryptedMessage || null,
          iv: iv || null,
          message: plainMessage || null,
          expiresAt,
        });

        await message.save();

        // Update room activity
        await ChatRoom.findOneAndUpdate({ roomId }, { lastActivity: new Date() });

        // Emit to all in room
        io.to(roomId).emit('receive_message', {
          _id: message._id,
          roomId,
          senderId: socket.userId,
          // include plain message if present, otherwise include encrypted payload
          message: message.message || undefined,
          encryptedMessage: message.encryptedMessage || undefined,
          iv: message.iv || undefined,
          createdAt: message.createdAt,
          deliveryStatus: 'delivered',
        });

        console.log(`💬 Message sent to room ${roomId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', (roomId) => {
      socket.to(roomId).emit('user_stopped_typing', { userId: socket.userId });
    });

    socket.on('message_read', async (data) => {
      try {
        const { messageId } = data;
        await Message.findByIdAndUpdate(messageId, { deliveryStatus: 'read' });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Failed to update disconnect status:', err.message);
      }

      console.log(`❌ User ${socket.userId} disconnected`);
    });
  });
};

export default setupSocketHandlers;
