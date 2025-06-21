import type { FastifyRequest, FastifyReply } from "fastify";

export function requireRole(role: "admin" | "revenda") {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		// O usuário já deve estar autenticado e o JWT decodificado
		const user = request.user as { role?: string };
		if (!user || user.role !== role) {
			return reply.status(403).send({
				error: true,
				message: "Acesso negado: permissão insuficiente",
			});
		}
	};
}
