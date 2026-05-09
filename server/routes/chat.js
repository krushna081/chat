import express from 'express';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

router.post('/create-room', chatController.createChatRoom);
router.post('/join-room', chatController.joinChatRoom);
router.get('/rooms', chatController.getChatRooms);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/leave/:roomId', chatController.leaveChatRoom);

export default router;
