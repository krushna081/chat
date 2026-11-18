import ChatRoom from '../models/ChatRoom.js';
import { AppError } from '../middleware/errors.js';

export const isParticipant = (room, userId) => {
  if (!room?.participants || !userId) return false;
  return room.participants.some((participant) => {
    const id = participant?._id || participant;
    return String(id) === String(userId);
  });
};

export const serializeRoom = (room, { includeKey = false } = {}) => {
  if (!room) return null;
  const serialized = {
    _id: room._id,
    roomId: room.roomId,
    roomName: room.roomName,
    roomPicture: room.roomPicture || null,
    isPrivate: Boolean(room.isPrivate || room.password),
    participantCount: room.participants?.length || 0,
    creator: room.creator,
    messageExpiry: room.messageExpiry,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
  };

  if (includeKey && room.roomKey) {
    serialized.roomKey = room.roomKey;
  }

  return serialized;
};

export const serializeMessage = (message) => ({
  _id: message._id,
  roomId: message.roomId,
  senderId: message.senderId,
  senderName: message.senderName,
  senderAvatar: message.senderAvatar,
  encryptedMessage: message.encryptedMessage,
  iv: message.iv,
  deliveryStatus: message.deliveryStatus,
  createdAt: message.createdAt,
  expiresAt: message.expiresAt,
});

export const findMemberRoom = async (roomId, userId, { includeKey = false } = {}) => {
  let query = ChatRoom.findOne({ roomId, participants: userId });
  if (includeKey) query = query.select('+roomKey');
  const room = await query;
  if (!room) {
    throw new AppError(403, 'You do not have access to this room');
  }
  return room;
};
