import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { z } from "zod";

export async function webhooksRoutes(app: FastifyInstance) {
	app.get(
		"/api/webhooks",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["webhooks"],
				summary: "Lista webhooks da revenda logada",
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const webhooks = await prisma.webhook.findMany({
				where: { revendaId },
				orderBy: { createdAt: "desc" },
			});
			return reply.send(webhooks);
		},
	);

	// Detalhes de um webhook
	app.get(
		"/api/webhooks/:id",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["webhooks"],
				summary: "Detalhes de um webhook da revenda logada",
				params: z.object({ id: z.string() }),
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			const webhook = await prisma.webhook.findFirst({
				where: { id, revendaId },
			});
			if (!webhook) {
				return reply
					.status(404)
					.send({ error: true, message: "Webhook não encontrado" });
			}
			return reply.send(webhook);
		},
	);

	// Reprocessar um webhook
	app.put(
		"/api/webhooks/:id/reprocess",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["webhooks"],
				summary: "Reprocessa um webhook da revenda logada",
				params: z.object({ id: z.string() }),
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			const webhook = await prisma.webhook.findFirst({
				where: { id, revendaId },
			});
			if (!webhook) {
				return reply
					.status(404)
					.send({ error: true, message: "Webhook não encontrado" });
			}
			const { webhookQueue } = await import("@/queues/index");
			await webhookQueue.add("reprocess", {
				revendaId,
				payload: webhook.payload,
			});
			return reply.send({ success: true });
		},
	);
}
