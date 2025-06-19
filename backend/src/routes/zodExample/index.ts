import type { FastifyInstance } from "fastify";
import { protectRoute } from "../../middlewares/jwt";
import { zodExampleBodySchema, zodExampleQuerySchema } from "./schemas";

export async function zodExampleRoutes(app: FastifyInstance) {
	app.post(
		"/zod-example",
		{
			preHandler: protectRoute,
			schema: {
				body: zodExampleBodySchema,
				querystring: zodExampleQuerySchema,
			},
		},
		async (request, reply) => {
			const body = request.body as { nome: string; idade: number };
			const query = request.query as { admin?: boolean };
			return reply.send({
				nome: body.nome,
				idade: body.idade,
				admin: query.admin,
				user: request.user,
			});
		},
	);
}
