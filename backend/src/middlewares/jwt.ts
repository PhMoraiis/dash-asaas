import type { FastifyRequest, FastifyReply } from "fastify";

export async function protectRoute(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	try {
		await request.jwtVerify();
	} catch (err) {
		return reply
			.status(401)
			.send({ error: true, message: "Token inválido ou ausente" });
	}
}
