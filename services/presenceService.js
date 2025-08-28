import Redis from 'ioredis';

let redis = null;
const useRedis = Boolean(process.env.REDIS_URL);
if (useRedis) redis = new Redis(process.env.REDIS_URL);

const inMemory = new Map();

async function setPresence(userId, socketId) {
	if (useRedis) {
		try {
			await redis.set(`presence:${userId}`, socketId, 'EX', 60 * 5);
			return;
		} catch (e) {
			console.warn('presenceService.setPresence redis error', e.message);
		}
	}
	inMemory.set(userId, socketId);
}

async function removePresenceBySocket(socketId) {
	if (useRedis) {
		try {
			const keys = await redis.keys('presence:*');
			for (const k of keys) {
				const v = await redis.get(k);
				if (v === socketId) await redis.del(k);
			}
			return;
		} catch (e) {
			console.warn('presenceService.removePresenceBySocket redis error', e.message);
		}
	}
	for (const [k, v] of inMemory.entries()) if (v === socketId) inMemory.delete(k);
}

async function getPresence(userId) {
	if (useRedis) {
		try {
			const v = await redis.get(`presence:${userId}`);
			return v;
		} catch (e) {
			console.warn('presenceService.getPresence redis error', e.message);
			return inMemory.get(userId) || null;
		}
	}
	return inMemory.get(userId) || null;
}

export { setPresence, removePresenceBySocket, getPresence };

