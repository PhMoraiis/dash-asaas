import type { FastifyInstance } from "fastify";

export function registerErrorHandler(app: FastifyInstance) {
	app.setErrorHandler((error, request, reply) => {
		request.log.error(error, "Erro não tratado");
		reply.status(error.statusCode || 500).send({
			error: true,
			message: error.message || "Erro interno do servidor",
			statusCode: error.statusCode || 500,
			details: error.validation || undefined,
		});
	});
}
