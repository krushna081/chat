import crypto from 'node:crypto';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  isValidEncryptedPayload,
  isValidImage,
  isValidRoomId,
  isValidRoomName,
  sanitizeText,
} from '../utils/validation.js';
import {
  findMemberRoom,
  isParticipant,
  serializeMessage,
  serializeRoom,
} from '../utils/roomAccess.js';
import { isValidExpiry } from '../utils/messageExpiry.js';

const PAGE_SIZE = 50;

export const createChatRoom = asyncHandler(async (req, res) => {
  const roomName = sanitizeText(req.body?.roomName, 80);
  const messageExpiry = req.body?.messageExpiry || '24h';
  const password = req.body?.password;
  const roomPicture = req.body?.roomPicture || null;

  if (!isValidRoomName(roomName)) {
    throw new AppError(400, 'Room name must be between 1 and 80 characters');
  }
  if (!isValidExpiry(messageExpiry)) {
    throw new AppError(400, 'Invalid message expiry');
  }
  if (password !== undefined && password !== null && password !== '') {
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      throw new AppError(400, 'Room password must be between 8 and 72 characters');
    }
  }
  if (!isValidImage(roomPicture)) {
    throw new AppError(400, 'Room picture must be an HTTPS URL or a supported image under 512 KB');
  }

  const chatRoom = await ChatRoom.create({
    roomId: crypto.randomBytes(8).toString('hex'),
    roomName,
    roomPicture: roomPicture || null,
    creator: req.userId,
    participants: [req.userId],
    roomKey: crypto.randomBytes(32).toString('hex'),
    messageExpiry,
    password: password || null,
    isPrivate: Boolean(password),
  });

  return res.status(201).json({
    success: true,
    message: 'Chat room created',
    chatRoom: serializeRoom(chatRoom, { includeKey: true }),
  });
});

export const joinChatRoom = asyncHandler(async (req, res) => {
  const roomId = String(req.body?.roomId || '');
  const password = req.body?.password;

  if (!isValidRoomId(roomId)) {
    throw new AppError(400, 'Invalid room id');
  }

  const chatRoom = await ChatRoom.findOne({ roomId }).select('+password +roomKey');
  if (!chatRoom) {
    throw new AppError(404, 'Room not found');
  }

  const alreadyMember = isParticipant(chatRoom, req.userId);
  const isPrivateRoom = Boolean(chatRoom.isPrivate || chatRoom.password);

  if (isPrivateRoom && !alreadyMember) {
    if (!chatRoom.password) {
      throw new AppError(403, 'This room has no usable password configured');
    }
    if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
      throw new AppError(403, 'Password required');
    }
    const passwordMatches = await chatRoom.comparePassword(password);
    if (!passwordMatches) {
      throw new AppError(403, 'Invalid room password');
    }
  }

  if (!alreadyMember) {
    await ChatRoom.updateOne({ _id: chatRoom._id }, { $addToSet: { participants: req.userId } });
  }

  const joinedRoom = await ChatRoom.findById(chatRoom._id).select('+roomKey +password');
  return res.status(200).json({
    success: true,
    message: 'Joined room',
    chatRoom: serializeRoom(joinedRoom, { includeKey: true }),
  });
});

export const getChatRooms = asyncHandler(async (req, res) => {
  const chatRooms = await ChatRoom.find({
    $or: [{ isPrivate: false, password: null }, { participants: req.userId }],
  })
    .select('-password -roomKey')
    .populate('creator', 'username avatar')
    .sort({ lastActivity: -1 })
    .limit(200)
    .lean();

  return res.status(200).json({
    success: true,
    chatRooms: chatRooms.map((room) => ({
      ...serializeRoom(room),
      isMember: isParticipant(room, req.userId),
    })),
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const roomId = String(req.params.roomId || '');
  if (!isValidRoomId(roomId)) {
    throw new AppError(400, 'Invalid room id');
  }

  await findMemberRoom(roomId, req.userId);

  const requestedPage = Number.parseInt(req.query.page, 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), 10_000) : 1;

  const [messages, total] = await Promise.all([
    Message.find({ roomId })
      .select('-message')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate('senderId', 'username avatar')
      .lean(),
    Message.countDocuments({ roomId }),
  ]);

  const safeMessages = messages.reverse().map((message) => ({
    ...serializeMessage(message),
    senderId: String(message.senderId?._id || message.senderId),
    senderName: message.senderId?.username || 'Unknown',
    senderAvatar: message.senderId?.avatar || null,
  }));

  return res.status(200).json({
    success: true,
    messages: safeMessages,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      pages: Math.ceil(total / PAGE_SIZE),
    },
  });
});

export const leaveChatRoom = asyncHandler(async (req, res) => {
  const roomId = String(req.params.roomId || '');
  if (!isValidRoomId(roomId)) {
    throw new AppError(400, 'Invalid room id');
  }

  const room = await ChatRoom.findOne({ roomId });
  if (!room) {
    throw new AppError(404, 'Room not found');
  }
  if (!isParticipant(room, req.userId)) {
    throw new AppError(403, 'You are not a member of this room');
  }

  await ChatRoom.updateOne({ _id: room._id }, { $pull: { participants: req.userId } });

  const io = req.app.get('io');
  if (io) {
    const sockets = await io.in(roomId).fetchSockets();
    sockets
      .filter((socket) => String(socket.userId) === String(req.userId))
      .forEach((socket) => socket.leave(roomId));
  }

  return res.status(200).json({ success: true, message: 'Left room' });
});

export const validateMessagePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  if (!isValidRoomId(payload.roomId)) return false;
  return isValidEncryptedPayload(payload.encryptedMessage, payload.iv);
};
