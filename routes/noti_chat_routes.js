import express from 'express';
import { register, unregister, sendTest } from '../controllers/noti_chat_controller.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

router.post('/noti/push/register', restrictTo('user','admin','superadmin'), register);
router.post('/noti/push/unregister', restrictTo('user','admin','superadmin'), unregister);
router.post('/noti/push/send-test', restrictTo('admin','superadmin'), sendTest);

export default router;
