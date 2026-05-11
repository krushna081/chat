import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

export const createChatRoom = async (req, res) => {
  try {
    const { roomName, messageExpiry, password, roomPicture } = req.body;
    const userId = req.userId;

    if (!roomName) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const roomId = crypto.randomBytes(8).toString('hex');
    const roomKey = crypto.randomBytes(32).toString('hex');

    const chatRoom = new ChatRoom({
      roomId,
      roomName,
      roomPicture: roomPicture || null,
      creator: userId,
      participants: [userId],
      roomKey,
      messageExpiry: messageExpiry || '24h',
      password: password ? password : null,
      isPrivate: !!password,
    });

    await chatRoom.save();

    res.status(201).json({
      success: true,
      message: 'Chat room created',
      chatRoom,
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const joinChatRoom = async (req, res) => {
  try {
    const { roomId, password } = req.body;
    const userId = req.userId;

    const chatRoom = await ChatRoom.findOne({ roomId });

    if (!chatRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // If the room has a password, require the client to provide it and verify against the hashed value
    if (chatRoom.password) {
      if (!password) {
        return res.status(403).json({ success: false, message: 'Password required' });
      }

      const isMatch = await bcryptjs.compare(password, chatRoom.password);
      if (!isMatch) {
        return res.status(403).json({ success: false, message: 'Invalid password' });
      }
    }

    if (!chatRoom.participants.includes(userId)) {
      chatRoom.participants.push(userId);
      await chatRoom.save();
    }

    // Return the room info including the roomKey so clients can use it for message encryption
    res.status(200).json({
      success: true,
      message: 'Joined room',
      chatRoom,
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({})
      .populate('creator', 'username')
      .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      chatRooms,
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1 } = req.query;
    const pageSize = 50;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('senderId', 'username avatar')
      .lean();

    const total = await Message.countDocuments({ roomId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    await ChatRoom.findOneAndUpdate(
      { roomId },
      { $pull: { participants: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Left room',
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
