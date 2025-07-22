import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { generateUniqueSlug } from "@/utils/slugIncremental";
import { createRevendaSchema, updateRevendaSchema } from "./schemas";
import { generateRandomPassword } from "@/utils/generateRandomPassword";

export async function revendasRoutes(app: FastifyInstance) {
	// Criar revenda
	app.post(
		"/api/admin/revendas",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Criar revenda",
				body: createRevendaSchema,
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
			const { name, email } = createRevendaSchema.parse(request.body);
			const exists = await prisma.revenda.findUnique({ where: { email } });
			if (exists) {
				return reply
					.status(409)
					.send({ error: true, message: "Revenda já existe" });
			}
			const password = generateRandomPassword(12);
			const hashed = await hash(password, 12);
			const slug = await generateUniqueSlug(name, "revenda");
			const revenda = await prisma.revenda.create({
				data: { name, email, password: hashed, slug, mustChangePassword: true },
			});
			return reply.status(201).send({
				success: true,
				id: revenda.id,
				slug: revenda.slug,
				name: revenda.name,
				email: revenda.email,
				password,
			});
		},
	);

	// Listar revendas
	app.get(
		"/api/admin/revendas",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Listar revendas",
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
			const revendas = await prisma.revenda.findMany({
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
			const revendasSerializadas = revendas.map((r: typeof revendas[0]) => ({
				...r,
				createdAt: r.createdAt.toISOString(),
				updatedAt: r.updatedAt.toISOString(),
			}));
			console.log("REVENDAS SERIALIZADAS:", revendasSerializadas);
			return reply.send(revendasSerializadas);
		},
	);

	// Editar revenda (pode ser usado para ativar/desativar via active: true/false)
	app.patch(
		"/api/admin/revendas/:id",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Editar revenda (pode ativar/desativar)",
				params: z.object({ id: z.string() }),
				body: updateRevendaSchema,
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const data = updateRevendaSchema.parse(request.body);
			// Impede alteração do campo 'active' por esse endpoint
			if ("active" in data) {
				data.active = undefined;
			}
			const revendaAtual = await prisma.revenda.findUnique({ where: { id } });
			if (!revendaAtual) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
			try {
				await prisma.revenda.update({
					where: { id },
					data: {
						...data,
						name: data.name ?? revendaAtual.name,
						email: data.email ?? revendaAtual.email,
					},
				});
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);

	// Ativar ou desativar revenda (soft delete/reativar)
	app.patch(
		"/api/admin/revendas/:id/status",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Ativar ou desativar revenda",
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
				await prisma.revenda.update({ where: { id }, data: { active } });
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);

	// Excluir revenda (delete real)
	app.delete(
		"/api/admin/revendas/:id/force",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Excluir revenda do banco de dados (delete real)",
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
				await prisma.revenda.delete({ where: { id } });
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);
}
