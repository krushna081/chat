import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  isValidImage,
  isValidRoomId,
  isValidUsername,
  normalizeUsername,
} from '../utils/validation.js';
import { isParticipant } from '../utils/roomAccess.js';

const getSafeUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getSafeUser(req.userId);
  return res.status(200).json({ success: true, user: user.toJSON() });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const updateData = {};
  const { theme, username, avatar } = req.body || {};

  if (theme !== undefined) {
    if (!['dark', 'light'].includes(theme)) {
      throw new AppError(400, 'Theme must be dark or light');
    }
    updateData.theme = theme;
  }

  if (username !== undefined) {
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      throw new AppError(
        400,
        'Username must be 3–24 characters using letters, numbers, dot, dash, or underscore'
      );
    }
    updateData.username = normalized;
  }

  if (avatar !== undefined) {
    if (avatar !== null && !isValidImage(avatar)) {
      throw new AppError(400, 'Avatar must be an HTTPS URL or a supported image under 512 KB');
    }
    updateData.avatar = avatar;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, 'No supported profile fields were provided');
  }

  const user = await User.findByIdAndUpdate(req.userId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError(404, 'User not found');

  return res.status(200).json({ success: true, user: user.toJSON() });
});

const updateMutedRoom = async (req, res, add) => {
  const roomId = String(req.body?.roomId || '');
  if (!isValidRoomId(roomId)) {
    throw new AppError(400, 'Invalid room id');
  }

  const room = await ChatRoom.findOne({ roomId });
  if (!room || !isParticipant(room, req.userId)) {
    throw new AppError(403, 'You do not have access to this room');
  }

  const update = add
    ? { $addToSet: { notificationMuted: room._id } }
    : { $pull: { notificationMuted: room._id } };

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) throw new AppError(404, 'User not found');

  return res.status(200).json({ success: true, user: user.toJSON() });
};

export const muteNotifications = asyncHandler(async (req, res) => updateMutedRoom(req, res, true));

export const unmuteNotifications = asyncHandler(async (req, res) =>
  updateMutedRoom(req, res, false)
);
