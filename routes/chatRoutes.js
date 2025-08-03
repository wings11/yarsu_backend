import express from 'express';
import { getChats, getMessages, sendMessage, replyMessage } from '../controllers/chatController.js';
import upload from '../uploadMiddleware.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

router.get('/chats', restrictTo('user', 'admin', 'superadmin'), getChats);
router.post('/chats', restrictTo('user', 'admin', 'superadmin'), async (req, res) => {
  const { user_id } = req.body;
  const { id, role } = req.user;
  console.log('POST /chats - Request:', { user_id, requester: { id, role } });
  try {
    // Ensure only the user can create a chat for themselves
    if (role === 'user' && user_id !== id) {
      console.log('POST /chats - Forbidden: Cannot create chat for another user');
      return res.status(403).json({ error: 'Cannot create chat for another user' });
    }
    // Validate UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!isValidUUID.test(user_id)) {
      console.log('POST /chats - Invalid user_id:', user_id);
      return res.status(400).json({ error: 'Invalid user_id format' });
    }
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id }])
      .select()
      .single();
    if (error) {
      console.error('POST /chats - Insert error:', error);
      return res.status(400).json({ error: error.message });
    }
    console.log('POST /chats - Created chat:', data);
    res.json(data);
  } catch (err) {
    console.error('POST /chats - Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});
router.get('/messages/:chatId', restrictTo('user', 'admin', 'superadmin'), getMessages);
router.post('/messages', restrictTo('user', 'admin', 'superadmin'), upload.single('file'), sendMessage);
router.post('/reply', restrictTo('admin', 'superadmin'), upload.single('file'), replyMessage);

export default router;