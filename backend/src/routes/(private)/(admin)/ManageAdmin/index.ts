import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { generateUniqueSlug } from "@/utils/slugIncremental";
import { createAdminSchema, updateAdminSchema } from "./schemas";
import { generateRandomPassword } from "@/utils/generateRandomPassword";

export async function adminRoutes(app: FastifyInstance) {
	// Listar admins
	app.get(
		"/api/admin/adm",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "admins"],
				summary: "Listar administradores",
				response: {
					200: z.array(
						z.object({
							id: z.string(),
							name: z.string(),
							email: z.string().email(),
							slug: z.string(),
							active: z.boolean(),
							createdAt: z.string(),
							updatedAt: z.string(),
						}),
					),
				},
			},
		},
		async (_request, reply) => {
			const admins = await prisma.admin.findMany({
				select: {
					id: true,
					name: true,
					email: true,
					slug: true,
					active: true,
					createdAt: true,
					updatedAt: true,
				},
				orderBy: { createdAt: "desc" },
			});
			const adminsSerializados = admins.map((a) => ({
				...a,
				createdAt: a.createdAt.toISOString(),
				updatedAt: a.updatedAt.toISOString(),
			}));
			return reply.send(adminsSerializados);
		},
	);

	// Criar admin
	app.post(
		"/api/admin/adm",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "admins"],
				summary: "Criar administrador",
				body: createAdminSchema,
				response: {
					201: z.object({
						success: z.boolean(),
						id: z.string(),
						slug: z.string(),
						name: z.string(),
						email: z.string().email(),
						password: z.string(),
					}),
					409: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { name, email } = createAdminSchema.parse(request.body);
			const exists = await prisma.admin.findUnique({ where: { email } });
			if (exists) {
				return reply
					.status(409)
					.send({ error: true, message: "Admin já existe" });
			}
			const password = generateRandomPassword(12);
			const hashed = await hash(password, 12);
			const slug = await generateUniqueSlug(name, "admin");
			const admin = await prisma.admin.create({
				data: { name, email, password: hashed, slug, mustChangePassword: true },
			});
			return reply.status(201).send({
				success: true,
				id: admin.id,
				slug: admin.slug,
				name: admin.name,
				email: admin.email,
				password,
			});
		},
	);

	// Editar admin (não permite alterar 'active' por aqui)
	app.patch(
		"/api/admin/adm/:id",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "admins"],
				summary: "Editar administrador (não permite alterar 'active')",
				params: z.object({ id: z.string() }),
				body: updateAdminSchema,
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const data = updateAdminSchema.parse(request.body);
			const adminAtual = await prisma.admin.findUnique({ where: { id } });
			if (!adminAtual) {
				return reply
					.status(404)
					.send({ error: true, message: "Admin não encontrado" });
			}
			await prisma.admin.update({
				where: { id },
				data: {
					...data,
					name: data.name ?? adminAtual.name,
					email: data.email ?? adminAtual.email,
				},
			});
			return reply.send({ success: true });
		},
	);

	// Desativar admin (soft delete)
	app.patch(
		"/api/admin/adm/:id/status",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "admins"],
				summary: "Ativar ou desativar administrador",
				params: z.object({ id: z.string() }),
				body: z.object({ active: z.boolean() }),
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { active } = request.body as { active: boolean };
			try {
				await prisma.admin.update({ where: { id }, data: { active } });
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Admin não encontrado" });
			}
		},
	);

	// Excluir admin (delete real)
	app.delete(
		"/api/admin/adm/:id/force",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "admins"],
				summary: "Excluir admin do banco de dados (delete real)",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			try {
				await prisma.admin.delete({ where: { id } });
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Admin não encontrado" });
			}
		},
	);
}
