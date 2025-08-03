import express from 'express';
import { getChats, getMessages, sendMessage, replyMessage } from '../controllers/chatController.js';
import upload from '../uploadMiddleware.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

router.get('/chats', restrictTo('user', 'admin', 'superadmin'), getChats);
router.post('/chats', restrictTo('user', 'admin', 'superadmin'), async (req, res) => {
  const { user_id } = req.body;
  const { id, role } = req.user;
  try {
    // Ensure only the user can create a chat for themselves
    if (role === 'user' && user_id !== id) {
      return res.status(403).json({ error: 'Cannot create chat for another user' });
    }
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id }])
      .select()
      .single();
    if (error) return res.status(400).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/messages/:chatId', restrictTo('user', 'admin', 'superadmin'), getMessages);
router.post('/messages', restrictTo('user', 'admin', 'superadmin'), upload.single('file'), sendMessage);
router.post('/reply', restrictTo('admin', 'superadmin'), upload.single('file'), replyMessage);

export default router;