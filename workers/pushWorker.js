import dotenv from 'dotenv';
import { dequeue } from '../services/queueService.js';

// Load .env for direct worker runs
dotenv.config();

async function runWorker() {
	// Dynamic import after dotenv so services that read process.env see loaded vars
	const { sendToUser } = await import('../services/noti_pushService.js');

	console.log('pushWorker started');
	while (true) {
		const job = await dequeue();
		if (!job) {
			await new Promise((r) => setTimeout(r, 1000));
			continue;
		}

		try {
			await sendToUser(job.userId, job.payload, job.options || {});
		} catch (e) {
			console.error('pushWorker failed to send job', e?.message || e, job);
		}
	}
}

if (import.meta.url === `file://${process.argv[1]}` || typeof require !== 'undefined' && require.main === module) {
	runWorker().catch((e) => {
		console.error('pushWorker crashed', e);
		process.exit(1);
	});
}

export default runWorker;


