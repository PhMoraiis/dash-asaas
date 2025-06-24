import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { forgotPasswordSchema, resetPasswordSchema } from "./schemas";
import { hash } from "bcryptjs";
import { z } from "zod";
import crypto from "node:crypto";
import { Resend } from "resend";
import ENV from "@/env";

export async function forgotRoutes(app: FastifyInstance) {
	// Solicitar recuperação de senha
	app.post(
		"/api/forgot-password",
		{
			schema: {
				tags: ["auth"],
				summary: "Solicitar recuperação de senha (Admin ou Revenda)",
				body: forgotPasswordSchema,
				response: {
					200: z.object({ success: z.boolean() }),
				},
			},
		},
		async (request, reply) => {
			const { email } = request.body as { email: string };
			// Procura usuário
			let user = await prisma.admin.findUnique({ where: { email } });
			let userType: "admin" | "revenda" | null = null;
			if (user) {
				userType = "admin";
			} else {
				user = await prisma.revenda.findUnique({ where: { email } });
				if (user) userType = "revenda";
			}
			// Sempre retorna sucesso para não expor e-mails válidos
			if (!user || !userType) {
				return reply.send({ success: true });
			}
			// Gera token
			const token = crypto.randomBytes(32).toString("hex");
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
			await prisma.passwordResetToken.create({
				data: {
					email,
					userType,
					token,
					expiresAt,
				},
			});

			// Envia e-mail usando Resend
			const resend = new Resend(ENV.RESEND_API_KEY);

			const result = await resend.emails.send({
				from: "Dash <no-reply@philipemorais.com>",
				to: email,
				subject: "Recuperação de senha",
				html: `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    <p>
      <a href="http://localhost:3000/reset-password?token=${token}">
        Clique aqui para redefinir sua senha
      </a>
    </p>
    <p>Se não foi você, ignore este e-mail.</p>
  `,
			});
			return reply.send({ success: true });
		},
	);

	// Redefinir senha
	app.post(
		"/api/reset-password",
		{
			schema: {
				tags: ["auth"],
				summary: "Redefinir senha usando token de recuperação",
				body: resetPasswordSchema,
				response: {
					200: z.object({ success: z.boolean() }),
					400: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { token, password } = request.body as {
				token: string;
				password: string;
			};
			const reset = await prisma.passwordResetToken.findUnique({
				where: { token },
			});
			if (!reset || reset.used || reset.expiresAt < new Date()) {
				return reply
					.status(400)
					.send({ error: true, message: "Token inválido ou expirado" });
			}
			// Atualiza senha
			let user: unknown;
			if (reset.userType === "admin") {
				user = await prisma.admin.update({
					where: { email: reset.email },
					data: { password: await hash(password, 12) },
				});
			} else if (reset.userType === "revenda") {
				user = await prisma.revenda.update({
					where: { email: reset.email },
					data: { password: await hash(password, 12) },
				});
			}
			// Marca token como usado
			await prisma.passwordResetToken.update({
				where: { token },
				data: { used: true },
			});
			return reply.send({ success: true });
		},
	);
}
