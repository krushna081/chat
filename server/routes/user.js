import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.post('/mute-notifications', userController.muteNotifications);
router.post('/unmute-notifications', userController.unmuteNotifications);

export default router;
