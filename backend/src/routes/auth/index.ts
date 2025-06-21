import type { FastifyInstance } from "fastify";
import { loginSchema } from "./schemas";
import { prisma } from "@/database/client";
import { compare, hash } from "bcryptjs";

export async function authRoutes(app: FastifyInstance) {
	app.post(
		"/api/login",
		{
			schema: { body: loginSchema },
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

			// Seta cookie seguro
			reply.setCookie("auth_token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 7, // 7 dias
			});

			return reply.send({ success: true, role });
		},
	);

	// Logout: limpa o cookie
	app.post("/api/logout", async (request, reply) => {
		reply.clearCookie("auth_token", { path: "/" });
		return reply.send({ success: true });
	});

	// Rota secreta para bootstrap do primeiro admin
	app.post("/__secret-create-admin", async (request, reply) => {
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
		const hashed = await hash(password, 10);
		const admin = await prisma.admin.create({
			data: { name, email, password: hashed },
		});
		return reply.send({ success: true, id: admin.id, email: admin.email });
	});
}
