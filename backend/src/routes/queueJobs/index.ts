import type { FastifyInstance } from "fastify";
import { webhookQueue, webhookDeadLetterQueue } from "../../queues";

interface TestQueuePayload {
	attempts?: number;
	backoff?: { type: string; delay: number };
	[key: string]: unknown;
}

export async function queueJobsRoutes(app: FastifyInstance) {
	app.post("/test-queue", async (request, reply) => {
		const {
			attempts = 3,
			backoff = { type: "exponential", delay: 1000 },
			...data
		} = request.body as TestQueuePayload;
		const job = await webhookQueue.add("teste", data, { attempts, backoff });
		return reply.send({
			jobId: job.id,
			status: "enfileirado",
			attempts,
			backoff,
		});
	});

	// Listar jobs da Dead Letter Queue
	app.get("/dead-letter-jobs", async (request, reply) => {
		const jobs = await webhookDeadLetterQueue.getJobs([
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
		]);
		return reply.send(
			jobs.map((job) => ({
				id: job.id,
				name: job.name,
				data: job.data,
				attemptsMade: job.attemptsMade,
				failedReason: job.failedReason,
				timestamp: job.timestamp,
			})),
		);
	});

	// Reprocessar um job da DLQ
	app.post("/dead-letter-jobs/:id/reprocess", async (request, reply) => {
		const { id } = request.params as { id: string };
		const job = await webhookDeadLetterQueue.getJob(id);
		if (!job) {
			return reply.status(404).send({ error: "Job não encontrado na DLQ" });
		}
		await webhookQueue.add("reprocessado", job.data);
		await job.remove();
		return reply.send({ status: "reenfileirado", jobId: id });
	});

	// Deletar um job da DLQ
	app.delete("/dead-letter-jobs/:id", async (request, reply) => {
		const { id } = request.params as { id: string };
		const job = await webhookDeadLetterQueue.getJob(id);
		if (!job) {
			return reply.status(404).send({ error: "Job não encontrado na DLQ" });
		}
		await job.remove();
		return reply.send({ status: "removido", jobId: id });
	});

	// Reprocessar todos os jobs da DLQ
	app.post("/dead-letter-jobs/reprocess-all", async (request, reply) => {
		const jobs = await webhookDeadLetterQueue.getJobs([
			"waiting",
			"active",
			"completed",
			"failed",
			"delayed",
		]);
		for (const job of jobs) {
			await webhookQueue.add("reprocessado", job.data);
			await job.remove();
		}
		return reply.send({ status: "todos reenfileirados", total: jobs.length });
	});
}
