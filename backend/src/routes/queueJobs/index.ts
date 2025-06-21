import type { FastifyInstance } from "fastify";
import { webhookQueue, webhookDeadLetterQueue } from "../../queues";
import type { TestQueuePayload } from "./type";
import { z } from "zod";

const testQueueBodySchema = z
	.object({
		attempts: z.number().int().min(1).max(10).optional().default(3),
		backoff: z
			.object({ type: z.string(), delay: z.number().int() })
			.optional()
			.default({ type: "exponential", delay: 1000 }),
	})
	.passthrough();

export async function queueJobsRoutes(app: FastifyInstance) {
	app.post(
		"/test-queue",
		{
			schema: {
				tags: ["test"],
				summary: "Adicionar job de teste à fila",
				body: testQueueBodySchema,
				response: {
					200: z.object({
						jobId: z.any(),
						status: z.string(),
						attempts: z.number(),
						backoff: z.any(),
					}),
				},
			},
		},
		async (request, reply) => {
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
		},
	);

	// Listar jobs da Dead Letter Queue
	app.get(
		"/dead-letter-jobs",
		{
			schema: {
				tags: ["test"],
				summary: "Listar jobs da Dead Letter Queue",
				response: {
					200: z.array(
						z.object({
							id: z.any(),
							name: z.string(),
							data: z.any(),
							attemptsMade: z.number(),
							failedReason: z.string().nullable(),
							timestamp: z.number(),
						}),
					),
				},
			},
		},
		async (request, reply) => {
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
		},
	);

	// Reprocessar um job da DLQ
	app.post(
		"/dead-letter-jobs/:id/reprocess",
		{
			schema: {
				tags: ["test"],
				summary: "Reprocessar um job da Dead Letter Queue",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({ status: z.string(), jobId: z.any() }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const job = await webhookDeadLetterQueue.getJob(id);
			if (!job) {
				return reply.status(404).send({ error: "Job não encontrado na DLQ" });
			}
			await webhookQueue.add("reprocessado", job.data);
			await job.remove();
			return reply.send({ status: "reenfileirado", jobId: id });
		},
	);

	// Deletar um job da DLQ
	app.delete(
		"/dead-letter-jobs/:id",
		{
			schema: {
				tags: ["test"],
				summary: "Deletar um job da Dead Letter Queue",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({ status: z.string(), jobId: z.any() }),
					404: z.object({ error: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const job = await webhookDeadLetterQueue.getJob(id);
			if (!job) {
				return reply.status(404).send({ error: "Job não encontrado na DLQ" });
			}
			await job.remove();
			return reply.send({ status: "removido", jobId: id });
		},
	);

	// Reprocessar todos os jobs da DLQ
	app.post(
		"/dead-letter-jobs/reprocess-all",
		{
			schema: {
				tags: ["test"],
				summary: "Reprocessar todos os jobs da Dead Letter Queue",
				response: {
					200: z.object({ status: z.string(), total: z.number() }),
				},
			},
		},
		async (request, reply) => {
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
		},
	);
}
