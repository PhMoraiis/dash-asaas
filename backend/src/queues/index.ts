import { Queue } from "bullmq";
import IORedis from "ioredis";

// Configuração da conexão Redis
export const connection = new IORedis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	maxRetriesPerRequest: null,
});

// Fila principal de webhooks
export const webhookQueue = new Queue("webhookQueue", {
	connection,
});

// Fila de Dead Letter (DLQ)
export const webhookDeadLetterQueue = new Queue("webhookDeadLetterQueue", {
	connection,
});
