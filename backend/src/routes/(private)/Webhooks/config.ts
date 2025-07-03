import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { webhookQueue } from "@/queues";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import ENV from "@/env";
import { z } from "zod";

export async function webhookConfigRoutes(app: FastifyInstance) {
	// Retorna URL e token atual do webhook da revenda autenticada
	app.get(
		"/api/revenda/webhook-config",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["webhook"],
				summary: "Obter configuração do webhook da revenda",
				response: {
					200: z.object({
						webhookUrl: z.string(),
						webhookToken: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const revenda = await prisma.revenda.findUnique({
				where: { id: revendaId },
			});
			if (!revenda)
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			const webhookUrl = `${ENV.EXTERNAL_API_URL}/api/webhooks/asaas`;
			return reply.send({ webhookUrl, webhookToken: revenda.webhookToken });
		},
	);
}
