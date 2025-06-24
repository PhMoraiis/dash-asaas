import type { FastifyInstance } from "fastify";
import { loginSchema } from "./schemas";
import { prisma, redis } from "@/database/client";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { generateRefreshToken } from "@/utils/auth";
import { protectRoute } from "@/middlewares/jwt";
import ENV from "@/env";

export async function authRoutes(app: FastifyInstance) {
	app.post(
		"/api/login",
		{
			schema: {
				tags: ["auth"],
				summary: "Login de usuário (Admin ou Revenda)",
				description: "Realiza login e retorna o cookie de autenticação.",
				body: loginSchema,
				response: {
					200: z.object({
						success: z.boolean(),
						id: z.string(),
						name: z.string(),
						email: z.string().email(),
						role: z.enum(["admin", "revenda"]),
					}),
					401: z.object({
						error: z.boolean(),
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body as {
				email: string;
				password: string;
			};

			// Tenta encontrar Admin
			let user = await prisma.admin.findUnique({ where: { email } });
			let role: "admin" | "revenda" | null = null;
			if (user) {
				role = "admin";
			} else {
				// Tenta encontrar Revenda
				user = await prisma.revenda.findUnique({ where: { email } });
				if (user) role = "revenda";
			}

			if (!user || !role) {
				return reply
					.status(401)
					.send({ error: true, message: "Usuário ou senha inválidos" });
			}

			// Valida senha (se for admin ou revenda)
			if (!(await compare(password, user.password))) {
				return reply
					.status(401)
					.send({ error: true, message: "Usuário ou senha inválidos" });
			}

			// Gera JWT
			const token = app.jwt.sign({
				id: user.id,
				email: user.email,
				role,
			});

			// Gera refresh token
			const refreshToken = generateRefreshToken();
			await redis.set(
				`refresh:${refreshToken}`,
				user.id,
				"EX",
				60 * 60 * 24 * 7,
			); // 7 dias

			// Seta cookies seguros
			reply
				.setCookie("auth_token", token, {
					httpOnly: true,
					secure: ENV.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 7, // 7 dias
				})
				.setCookie("refresh_token", refreshToken, {
					httpOnly: true,
					secure: ENV.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 7,
				});
			return reply.send({
				id: user.id,
				name: user.name,
				email: user.email,
				role,
				success: true,
			});
		},
	);

	// Refresh token endpoint
	app.post(
		"/api/refresh",
		{
			schema: {
				tags: ["auth"],
				summary: "Renova o access token usando refresh token",
				description:
					"Gera novo JWT e refresh token se o refresh token for válido.",
				response: {
					200: z.object({ success: z.boolean() }),
					401: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const refreshToken = request.cookies.refresh_token;
			if (!refreshToken) {
				return reply
					.status(401)
					.send({ error: true, message: "Refresh token ausente" });
			}

			const userId = await redis.get(`refresh:${refreshToken}`);
			if (!userId) {
				return reply
					.status(401)
					.send({ error: true, message: "Refresh token inválido" });
			}

			// Busca usuário (admin ou revenda)
			let user = await prisma.admin.findUnique({ where: { id: userId } });
			let role: "admin" | "revenda" | null = null;
			if (user) {
				role = "admin";
			} else {
				user = await prisma.revenda.findUnique({ where: { id: userId } });
				if (user) role = "revenda";
			}
			if (!user || !role) {
				return reply
					.status(401)
					.send({ error: true, message: "Usuário não encontrado" });
			}

			// Gera novo JWT
			const token = app.jwt.sign({
				id: user.id,
				email: user.email,
				role,
			});

			// Rotaciona refresh token
			const newRefreshToken = generateRefreshToken();
			await redis.del(`refresh:${refreshToken}`);
			await redis.set(
				`refresh:${newRefreshToken}`,
				user.id,
				"EX",
				60 * 60 * 24 * 7,
			);

			reply
				.setCookie("auth_token", token, {
					httpOnly: true,
					secure: ENV.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 7,
				})
				.setCookie("refresh_token", newRefreshToken, {
					httpOnly: true,
					secure: ENV.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 7,
				});

			return reply.send({ success: true });
		},
	);

	// Logout: limpa o cookie e remove refresh token do Redis
	app.post(
		"/api/logout",
		{
			schema: {
				tags: ["auth"],
				summary: "Logout",
				description: "Remove o cookie de autenticação e o refresh token.",
				response: {
					200: z.object({
						success: z.boolean(),
					}),
				},
			},
		},
		async (request, reply) => {
			const refreshToken = request.cookies.refresh_token;
			if (refreshToken) {
				await redis.del(`refresh:${refreshToken}`);
			}
			reply
				.clearCookie("auth_token", { path: "/" })
				.clearCookie("refresh_token", { path: "/" })
				.send({ success: true });
		},
	);

	// Rota secreta para bootstrap do primeiro admin
	app.post(
		"/__secret-create-admin",
		{
			schema: {
				tags: ["admin"],
				summary: "Criação secreta do primeiro admin",
				description:
					"Rota secreta para bootstrap do primeiro admin. Remover após uso.",
				body: z.object({
					name: z.string(),
					email: z.string().email(),
					password: z
						.string()
						.min(12)
						.regex(
							/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
							"Senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.",
						),
				}),
				response: {
					200: z.object({
						success: z.boolean(),
						id: z.string(),
						email: z.string().email(),
					}),
					409: z.object({
						error: z.boolean(),
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { name, email, password } = request.body as {
				name: string;
				email: string;
				password: string;
			};
			// Verifica se já existe admin com esse email
			const exists = await prisma.admin.findUnique({ where: { email } });
			if (exists) {
				return reply
					.status(409)
					.send({ error: true, message: "Admin já existe" });
			}
			const hashed = await hash(password, 12);
			const admin = await prisma.admin.create({
				data: { name, email, password: hashed },
			});
			return reply.send({
				success: true,
				id: admin.id,
				name: admin.name,
				email: admin.email,
			});
		},
	);

	// Endpoint para retornar dados do usuário autenticado
	app.get(
		"/api/me",
		{
			schema: {
				tags: ["auth"],
				summary: "Retorna dados do usuário autenticado",
				response: {
					200: z.object({
						id: z.string(),
						name: z.string(),
						email: z.string().email(),
						role: z.enum(["admin", "revenda"]),
					}),
					401: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
			preHandler: protectRoute,
		},
		async (request, reply) => {
			const { id, role } = request.user as {
				id: string;
				role: "admin" | "revenda";
			};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			let user: any;
			if (role === "admin") {
				user = await prisma.admin.findUnique({ where: { id } });
			} else {
				user = await prisma.revenda.findUnique({ where: { id } });
			}
			if (!user) {
				return reply
					.status(401)
					.send({ error: true, message: "Usuário não encontrado" });
			}
			return reply.send({
				id: user.id,
				name: user.name,
				email: user.email,
				role,
			});
		},
	);
}
