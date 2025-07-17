import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import get from "lodash/get";

export async function chartsRoutes(app: FastifyInstance) {
	// Gráfico Pizza: Clientes x Vendas Hoje
	app.get(
		"/api/charts/clients-vs-sales-today",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["charts"],
				summary: "Clientes x Vendas Hoje (Pizza)",
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			const webhooks = await prisma.webhook.findMany({
				where: {
					revendaId,
					createdAt: {
						gte: today,
						lt: tomorrow,
					},
				},
				select: {
					payload: true,
				},
			});

			const clientesSet = new Set<string>();
			let pagas = 0;
			let naoPagas = 0;
			for (const w of webhooks) {
				const customer = get(w, ["payload", "payment", "customer"]);
				if (customer) clientesSet.add(customer);
				if (
					["RECEIVED", "SUCCESS", "PAID"].includes(
						get(w, ["payload", "payment", "status"]) || "",
					)
				)
					pagas++;
				else naoPagas++;
			}

			return reply.send({
				labels: ["Pagas", "Não Pagas"],
				datasets: [{ data: [pagas, naoPagas] }],
				clientes: clientesSet.size,
			});
		},
	);

	// Gráfico Barras: Faturamento do Mês
	app.get(
		"/api/charts/monthly-revenue",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["charts"],
				summary: "Faturamento do mês (Barras)",
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

			const webhooks = await prisma.webhook.findMany({
				where: {
					revendaId,
					createdAt: {
						gte: firstDay,
						lt: nextMonth,
					},
				},
				select: {
					createdAt: true,
					payload: true,
				},
			});

			// Agrupar por dia
			const dias: Record<
				string,
				{ faturado: number; pago: number; liquido: number }
			> = {};
			for (const w of webhooks) {
				const dia = w.createdAt.toISOString().slice(0, 10);
				if (!dias[dia]) dias[dia] = { faturado: 0, pago: 0, liquido: 0 };
				const valor = Number(get(w, ["payload", "payment", "value"])) || 0;
				const net = Number(get(w, ["payload", "payment", "netValue"])) || 0;
				const isPago = ["RECEIVED", "SUCCESS", "PAID"].includes(
					get(w, ["payload", "payment", "status"]) || "",
				);
				dias[dia].faturado += valor;
				if (isPago) {
					dias[dia].pago += valor;
					dias[dia].liquido += net;
				}
			}
			const labels = Object.keys(dias).sort();
			const faturado = labels.map((d) => dias[d].faturado);
			const pago = labels.map((d) => dias[d].pago);
			const liquido = labels.map((d) => dias[d].liquido);

			return reply.send({
				labels,
				datasets: [
					{ label: "Faturado", data: faturado },
					{ label: "Pago", data: pago },
					{ label: "Líquido", data: liquido },
				],
			});
		},
	);
}
