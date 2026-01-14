/**
 * Push Notification Service - Oracle Version
 */

import admin from 'firebase-admin';
import { executeQuery, executeInsert } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function initFirebase() {
  if (admin.apps && admin.apps.length) return admin.app();
  
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!svcPath) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const candidate = path.join(__dirname, '..', 'firebase-service-account.json');
      if (fs.existsSync(candidate)) {
        svcPath = candidate;
        console.log('noti_pushService init - using fallback service account path', candidate);
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('noti_pushService init - svcPath set?', !!svcPath, 'svcJson set?', !!svcJson, 'svcB64 set?', !!svcB64);
  
  let parsed = null;
  try {
    if (svcPath) {
      const content = fs.readFileSync(svcPath, 'utf8');
      parsed = JSON.parse(content);
    } else if (svcB64) {
      const decoded = Buffer.from(svcB64, 'base64').toString('utf8');
      parsed = JSON.parse(decoded);
    } else if (svcJson) {
      parsed = JSON.parse(svcJson);
    } else {
      console.warn('No Firebase service account provided.');
      return null;
    }
    const app = admin.initializeApp({ credential: admin.credential.cert(parsed) });
    console.log('Firebase initialized for noti_pushService');
    return app;
  } catch (err) {
    console.error('Failed to initialize Firebase:', err.message);
    return null;
  }
}

const firebaseApp = initFirebase();

async function registerToken({ userId, token, deviceId = null, platform = 'android' }) {
  try {
    // Check if token already exists
    const existing = await executeQuery(
      'SELECT id FROM noti_push_tokens WHERE token = :token',
      { token }
    );
    
    if (existing.rows && existing.rows.length > 0) {
      // Update existing
      await executeQuery(
        `UPDATE noti_push_tokens 
         SET user_id = :userId, device_id = :deviceId, platform = :platform, 
             enabled = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE token = :token`,
        { userId, deviceId, platform, token }
      );
    } else {
      // Insert new
      const id = uuidv4();
      await executeQuery(
        `INSERT INTO noti_push_tokens (id, user_id, token, device_id, platform, provider, enabled)
         VALUES (:id, :userId, :token, :deviceId, :platform, 'fcm', 1)`,
        { id, userId, token, deviceId, platform }
      );
    }
    
    return { success: true };
  } catch (err) {
    console.error('registerToken error', err.message);
    throw err;
  }
}

async function unregisterToken({ userId, token, deviceId = null }) {
  try {
    let sql = 'DELETE FROM noti_push_tokens WHERE 1=1';
    const binds = {};
    
    if (token) {
      sql += ' AND token = :token';
      binds.token = token;
    }
    if (deviceId) {
      sql += ' AND device_id = :deviceId';
      binds.deviceId = deviceId;
    }
    if (userId) {
      sql += ' AND user_id = :userId';
      binds.userId = userId;
    }
    
    if (Object.keys(binds).length === 0) {
      throw new Error('unregisterToken requires token, deviceId, or userId');
    }
    
    await executeQuery(sql, binds);
    return { success: true };
  } catch (err) {
    console.error('unregisterToken error', err.message);
    throw err;
  }
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function sendToUser(userId, payload = { data: {} }, options = {}) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized; skipping push send');
    return null;
  }
  
  try {
    const result = await executeQuery(
      'SELECT token FROM noti_push_tokens WHERE user_id = :userId AND enabled = 1',
      { userId }
    );
    
    const tokens = (result.rows || []).map(r => r.TOKEN).filter(Boolean);
    if (!tokens.length) return { success: true, message: 'no tokens' };

    const batches = chunkArray(tokens, 500);
    const results = [];
    
    for (const batch of batches) {
      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          ...payload,
          android: { priority: 'high', ...payload.android },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: { aps: { contentAvailable: true } },
            ...payload.apns
          }
        });
        results.push(response);
      } catch (batchErr) {
        console.error('sendToUser batch error', batchErr.message);
      }
    }
    
    return { success: true, results };
  } catch (err) {
    console.error('sendToUser error', err.message);
    return null;
  }
}

async function sendToTopic(topic, payload = { data: {} }) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized; skipping topic send');
    return null;
  }
  
  try {
    const response = await admin.messaging().send({
      topic,
      ...payload,
      android: { priority: 'high', ...payload.android },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { contentAvailable: true } },
        ...payload.apns
      }
    });
    return { success: true, response };
  } catch (err) {
    console.error('sendToTopic error', err.message);
    return null;
  }
}

export { registerToken, unregisterToken, sendToUser, sendToTopic };
