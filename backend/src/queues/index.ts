import ENV from "@/env";
import { Queue } from "bullmq";
import IORedis from "ioredis";

// Configuração da conexão Redis
export const connection = new IORedis({
	host: ENV.REDIS_HOST,
	port: Number(ENV.REDIS_PORT),
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
