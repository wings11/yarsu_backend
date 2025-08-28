import Redis from 'ioredis';

let redis = null;
const useRedis = Boolean(process.env.REDIS_URL);
if (useRedis) redis = new Redis(process.env.REDIS_URL);

// Simple enqueue/dequeue using Redis list or in-memory array (fallback)
const inMemoryQueue = [];

async function enqueue(job) {
	if (useRedis) {
		try {
			await redis.lpush('push_jobs', JSON.stringify(job));
			return;
		} catch (e) {
			console.warn('queueService.enqueue redis error', e.message);
		}
	}
	inMemoryQueue.push(job);
}

async function dequeue() {
	if (useRedis) {
		try {
			const result = await redis.rpop('push_jobs');
			return result ? JSON.parse(result) : null;
		} catch (e) {
			console.warn('queueService.dequeue redis error', e.message);
		}
	}
	return inMemoryQueue.shift() || null;
}

export { enqueue, dequeue };

