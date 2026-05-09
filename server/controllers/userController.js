import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { theme, username } = req.body;

    const updateData = {};
    if (theme) updateData.theme = theme;
    if (username) updateData.username = username;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const muteNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { roomId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { notificationMuted: roomId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Mute notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unmuteNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { roomId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { notificationMuted: roomId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Unmute notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
