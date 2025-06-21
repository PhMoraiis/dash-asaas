import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { protectRoute } from "../../middlewares/jwt";
import { requireRole } from "../../middlewares/role";

export async function testRoutes(app: FastifyInstance) {
	// Exemplo de rota protegida
	app.get(
		"/private-test",
		{
			preHandler: protectRoute,
			schema: {
				tags: ["test"],
				summary: "Rota protegida por JWT",
				response: {
					200: z.object({
						message: z.string(),
						user: z.any(),
					}),
				},
			},
		},
		async (request, reply) => {
			return reply.send({ message: "Acesso autorizado!", user: request.user });
		},
	);

	// Rota só para admin
	app.get(
		"/admin-only",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["test"],
				summary: "Acesso apenas para admin",
				response: {
					200: z.object({
						message: z.string(),
						user: z.any(),
					}),
					403: z.object({
						error: z.boolean(),
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			return reply.send({
				message: "Acesso autorizado para admin!",
				user: request.user,
			});
		},
	);

	// Rota só para revenda
	app.get(
		"/revenda-only",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["test"],
				summary: "Acesso apenas para revenda",
				response: {
					200: z.object({
						message: z.string(),
						user: z.any(),
					}),
					403: z.object({
						error: z.boolean(),
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			return reply.send({
				message: "Acesso autorizado para revenda!",
				user: request.user,
			});
		},
	);
}
