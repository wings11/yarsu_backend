import express from 'express';
import { getChats, getMessages, sendMessage, replyMessage } from '../controllers/chatController.js';
import upload from '../uploadMiddleware.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

router.get('/chats', restrictTo('user', 'admin', 'superadmin'), getChats);
router.get('/messages/:chatId', restrictTo('user', 'admin', 'superadmin'), getMessages);
router.post('/messages', restrictTo('user', 'admin', 'superadmin'), upload.single('file'), sendMessage);
router.post('/reply', restrictTo('admin', 'superadmin'), upload.single('file'), replyMessage);

export default router;
