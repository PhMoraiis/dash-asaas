import type { FastifyInstance } from "fastify";

export function registerLoggingHooks(app: FastifyInstance) {
	app.addHook("onRequest", async (request, reply) => {
		request.log.info(
			{ method: request.method, url: request.url },
			"Requisição recebida",
		);
	});

	app.addHook("onResponse", async (request, reply) => {
		request.log.info(
			{
				method: request.method,
				url: request.url,
				statusCode: reply.statusCode,
			},
			"Resposta enviada",
		);
	});
}
