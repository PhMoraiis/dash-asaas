import { prisma } from "@/database/client";
import { webhookQueue } from "@/queues";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function webhooksPublicRoutes(app: FastifyInstance) {
	// Endpoint público: Receber webhooks do Asaas
	app.post(
		"/api/webhooks/asaas",
		{
			schema: {
				tags: ["webhook"],
				summary: "Receber webhooks do Asaas (valida token)",
				body: z.object({}).passthrough(),
				response: {
					200: z.object({ status: z.string() }),
					401: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const body = request.body as any;
			console.info(
				`[WEBHOOK] Recebido: id=${body.id} event=${body.event} revenda=${body.revendaId}`,
			);
			const token = request.headers["asaas-access-token"] as string | undefined;
			if (!token) {
				return reply.status(401).send({
					error: true,
					message: "Token ausente no header asaas-access-token",
				});
			}
			const revenda = await prisma.revenda.findUnique({
				where: { webhookToken: token },
			});
			if (!revenda) {
				return reply
					.status(401)
					.send({ error: true, message: "Token inválido" });
			}

			// Idempotência: verifica se já existe esse evento
			const asaasEventId = body.id;
			if (!asaasEventId) {
				console.error("Webhook recebido sem asaasEventId", body);
				return reply
					.status(400)
					.send({ error: true, message: "Webhook sem asaasEventId" });
			}
			const exists = await prisma.webhook.findUnique({
				where: { asaasEventId },
			});
			if (exists) {
				console.warn("Evento já processado, ignorando:", asaasEventId);
				return reply.send({ status: "Evento já processado" });
			}

			// Salva o webhook no banco
			await prisma.webhook.create({
				data: {
					asaasEventId,
					event: body.event,
					payload: body,
					revendaId: revenda.id,
					externalId: body.payment?.id ?? null,
					status: "PENDING",
				},
			});
			console.log("Webhook salvo no banco:", asaasEventId);

			// Enfileira o webhook para processamento assíncrono
			await webhookQueue.add("webhook-recebido", {
				revendaId: revenda.id,
				payload: body,
				receivedAt: new Date().toISOString(),
			});

			return reply.send({ status: "Webhook recebido e enfileirado" });
		},
	);
}
