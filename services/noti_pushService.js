import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lazily initialize Supabase admin client to avoid module-evaluation time dependency on env vars
let supabaseAdmin = null;
function getSupabaseAdmin() {
	if (supabaseAdmin) return supabaseAdmin;
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
	if (!supabaseUrl || !supabaseServiceKey) {
		console.warn('Supabase env not set for noti_pushService');
		return null;
	}
	supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
	return supabaseAdmin;
}

function initFirebase() {
	if (admin.apps && admin.apps.length) return admin.app();
	// Support three ways to provide the service account:
	// 1) FIREBASE_SERVICE_ACCOUNT_JSON => raw JSON string
	// 2) FIREBASE_SERVICE_ACCOUNT_PATH => path to a JSON file
	// 3) FIREBASE_SERVICE_ACCOUNT_B64 => base64-encoded JSON
	const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	let svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
	const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

	// fallback: if no env path provided, try the repository backend/firebase-service-account.json
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
	// non-sensitive debug: log whether env vars are present (do not print contents)
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
			console.warn('No Firebase service account provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_B64');
			return null;
		}
		const app = admin.initializeApp({ credential: admin.credential.cert(parsed) });
		console.log('Firebase initialized for noti_pushService');
		return app;
	} catch (err) {
		console.error('Failed to initialize Firebase from provided service account:', err.message);
		return null;
	}
}

const firebaseApp = initFirebase();

async function registerToken({ userId, token, deviceId = null, platform = 'android' }) {
	try {
		const payload = { user_id: userId, token, device_id: deviceId, platform, provider: 'fcm', enabled: true };
		const adminClient = getSupabaseAdmin();
		if (!adminClient) throw new Error('Supabase admin client not initialized');
		// ON CONFLICT requires a unique or exclusion constraint in Postgres.
		// Use the token column as the canonical unique key for push tokens and
		// ensure the migration creates a unique index on `token` (see migration file).
		const { data, error } = await adminClient
				.from('noti_push_tokens')
				.upsert(payload, { onConflict: 'token' })
				.select();
		if (error) {
			console.error('registerToken - supabase upsert error', error);
			throw error;
		}
		return data;
	} catch (err) {
		console.error('registerToken error', err.message);
		throw err;
	}
}

async function unregisterToken({ userId, token, deviceId = null }) {
	try {
		const adminClient = getSupabaseAdmin();
		if (!adminClient) throw new Error('Supabase admin client not initialized');
		let qb = adminClient.from('noti_push_tokens');
		if (token) qb = qb.eq('token', token);
		if (deviceId) qb = qb.eq('device_id', deviceId);
		if (userId) qb = qb.eq('user_id', userId);
		const { data, error } = await qb.delete().select();
		if (error) {
			console.error('unregisterToken supabase error', error);
			throw error;
		}
		return data;
	} catch (err) {
		console.error('unregisterToken error', err.message);
		throw err;
	}
}

function chunkArray(arr, size) {
	const chunks = [];
	for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
	return chunks;
}

async function sendToUser(userId, payload = { data: {} }, options = {}) {
	if (!firebaseApp) {
		console.warn('Firebase not initialized; skipping push send');
		return null;
	}
	try {
			const adminClient = getSupabaseAdmin();
			if (!adminClient) {
				console.warn('Supabase admin client not initialized; skipping sendToUser');
				return null;
			}
			const { data: rows, error } = await adminClient.from('noti_push_tokens').select('token').eq('user_id', userId).eq('enabled', true);
		if (error) {
			console.error('sendToUser - supabase select error', error);
			return null;
		}
		const tokens = (rows || []).map(r => r.token).filter(Boolean);
		if (!tokens.length) return { success: true, message: 'no tokens' };

		const batches = chunkArray(tokens, 500);
		const results = [];
		for (const batch of batches) {
			const message = {
				tokens: batch,
				data: Object.assign({}, payload.data || {}, { messageId: String(payload.data?.messageId || '') }),
				android: { priority: 'high', ttl: options.ttl || 0 },
				apns: { headers: { 'apns-priority': '10', 'apns-expiration': String(options.apnsExpiration || 0) }, payload: { aps: { 'content-available': 1, sound: 'default' } } }
			};
			const resp = await admin.messaging().sendMulticast(message);
			results.push(resp);

			resp.responses.forEach(async (r, idx) => {
				if (!r.success) {
					const token = batch[idx];
					if (r.error && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error.code)) {
						try {
							await adminClient.from('noti_push_tokens').update({ enabled: false }).eq('token', token);
							console.log('Disabled invalid token', token);
						} catch (e) {
							console.error('Failed to disable token', token, e.message);
						}
					}
				}
			});
		}
		return { success: true, results };
	} catch (err) {
		console.error('sendToUser error', err.message);
		return { success: false, error: err.message };
	}
}

export { registerToken, unregisterToken, sendToUser };
