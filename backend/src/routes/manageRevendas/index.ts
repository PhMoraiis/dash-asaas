import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { generateUniqueSlug } from "@/utils/slugIncremental";

const createRevendaSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(8),
	externalId: z.string().optional(),
});

const updateRevendaSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	password: z.string().min(8).optional(),
	externalId: z.string().optional(),
	active: z.boolean().optional(),
});

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
					}),
					409: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { name, email, password, externalId } = createRevendaSchema.parse(
				request.body,
			);
			const exists = await prisma.revenda.findUnique({ where: { email } });
			if (exists) {
				return reply
					.status(409)
					.send({ error: true, message: "Revenda já existe" });
			}
			const hashed = await hash(password, 12);
			const slug = await generateUniqueSlug(name, "revenda");
			const revenda = await prisma.revenda.create({
				data: { name, email, password: hashed, externalId, slug },
			});
			return reply
				.status(201)
				.send({ success: true, id: revenda.id, slug: revenda.slug });
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
							externalId: z.string().nullable(),
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
					externalId: true,
					slug: true,
					active: true,
					createdAt: true,
					updatedAt: true,
				},
				orderBy: { createdAt: "desc" },
			});
			return reply.send(revendas);
		},
	);

	// Editar revenda
	app.put(
		"/api/admin/revendas/:id",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Editar revenda",
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
			if (data.password) {
				data.password = await hash(data.password, 12);
			}
			try {
				await prisma.revenda.update({ where: { id }, data });
				return reply.send({ success: true });
			} catch (e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);

	// Desativar revenda (soft delete)
	app.delete(
		"/api/admin/revendas/:id",
		{
			preHandler: [protectRoute, requireRole("admin")],
			schema: {
				tags: ["admin", "revendas"],
				summary: "Desativar revenda",
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
				await prisma.revenda.update({ where: { id }, data: { active: false } });
				return reply.send({ success: true });
			} catch (e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);
}
