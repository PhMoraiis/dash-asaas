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

	// Estatísticas para o dashboard
	app.get(
		"/api/webhooks/stats",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["webhooks", "stats"],
				summary: "Estatísticas agregadas dos webhooks da revenda logada",
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const total = await prisma.webhook.count({ where: { revendaId } });
			const statusAgg = await prisma.webhook.groupBy({
				by: ["status"],
				where: { revendaId },
				_count: { status: true },
			});
			const byStatus = Object.fromEntries(
				statusAgg.map((s) => [s.status, s._count.status]),
			);
			const eventAgg = await prisma.webhook.groupBy({
				by: ["event"],
				where: { revendaId },
				_count: { event: true },
			});
			const byEvent = Object.fromEntries(
				eventAgg.map((e) => [e.event, e._count.event]),
			);
			const latest = await prisma.webhook.findMany({
				where: { revendaId },
				orderBy: { createdAt: "desc" },
				take: 5,
			});
			return reply.send({ total, byStatus, byEvent, latest });
		},
	);
}
