import { Worker, Job } from "bullmq";
import { connection, webhookDeadLetterQueue } from "./index";
import { prisma } from "@/database/client";

// Worker para processar jobs da fila webhookQueue
export const webhookWorker = new Worker(
	"webhookQueue",
	async (job) => {
		console.log("Processando job:", job.id, job.name, job.data);
		// Simulação de erro para testar retries e DLQ
		if (job.data.forcarErro) {
			throw new Error("Erro forçado para teste de retry/DLQ");
		}
		// Aqui vai a lógica real de processamento do webhook
		const { revendaId, payload } = job.data;

		// Exemplo: logar o evento recebido
		console.info(
			`[WORKER] Processando: id=${payload.id} event=${payload.event} revenda=${revendaId}`,
		);
		try {
			// Aqui você pode implementar a lógica de negócio desejada
			await prisma.webhook.update({
				where: { asaasEventId: payload.id },
				data: { processedAt: new Date(), status: "SUCCESS" },
			});
			console.info(`[WORKER] Sucesso: id=${payload.id}`);
		} catch (err) {
			console.error(
				`[WORKER] Erro: id=${payload.id} erro=${(err as Error).message}`,
			);
			// Atualize status para FAILED se quiser
		}
	},
	{ connection },
);

webhookWorker.on("completed", (job) => {
	console.log(`Job ${job.id} processado com sucesso!`);
});

webhookWorker.on("failed", async (job, err) => {
	console.error(`Job ${job?.id} falhou:`, err);
	// Se o job atingiu o número máximo de tentativas, envia para a DLQ
	if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
		await webhookDeadLetterQueue.add("dead-letter", job.data);
		console.warn(`Job ${job.id} movido para a Dead Letter Queue.`);
	}
});
