/**
 * Push Notification Controller - Oracle Version
 */

import { registerToken, unregisterToken, sendToUser } from '../services/noti_pushService_oracle.js';

// Register a device token for the authenticated user
export async function register(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { token, deviceId = null, platform = 'android' } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token is required' });

    const result = await registerToken({ userId, token, deviceId, platform });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('noti.register error', err?.message || err);
    return res.status(500).json({ error: 'register failed', details: err?.message });
  }
}

// Unregister a device token
export async function unregister(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { token, deviceId = null } = req.body || {};
    if (!token && !deviceId) return res.status(400).json({ error: 'token or deviceId required' });

    const result = await unregisterToken({ userId, token, deviceId });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('noti.unregister error', err?.message || err);
    return res.status(500).json({ error: 'unregister failed', details: err?.message });
  }
}

// Admin-only: send a test push to a user
export async function sendTest(req, res) {
  try {
    const { userId, title = 'Test', body = 'Test message' } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const payload = { data: { title, body, messageId: `test-${Date.now()}` } };
    const result = await sendToUser(userId, payload, { ttl: 0, apnsExpiration: 0 });
    return res.json({ success: true, result });
  } catch (err) {
    console.error('noti.sendTest error', err?.message || err);
    return res.status(500).json({ error: 'sendTest failed', details: err?.message });
  }
}
