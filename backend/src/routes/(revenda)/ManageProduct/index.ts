import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { createProductSchema, updateProductSchema } from "./schemas";
import { z } from "zod";

export async function productRoutes(app: FastifyInstance) {
	// Criar produto
	app.post(
		"/api/products",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Criar produto",
				body: createProductSchema,
				response: {
					201: createProductSchema.extend({
						id: z.string(),
						revendaId: z.string(),
						active: z.boolean(),
						createdAt: z.string(),
						updatedAt: z.string(),
					}),
					409: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const data = createProductSchema.parse(request.body);
			// Nome único por revenda (opcional, remova se não quiser)
			const exists = await prisma.produto.findFirst({
				where: { name: data.name, revendaId },
			});
			if (exists) {
				return reply
					.status(409)
					.send({ error: true, message: "Produto já existe" });
			}
			const produto = await prisma.produto.create({
				data: { ...data, revendaId },
			});
			return reply.status(201).send({
				...produto,
				createdAt: produto.createdAt.toISOString(),
				updatedAt: produto.updatedAt.toISOString(),
			});
		},
	);

	// Listar produtos da revenda logada
	app.get(
		"/api/products",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Listar produtos da revenda logada",
				response: {
					200: z.array(
						createProductSchema.extend({
							id: z.string(),
							revendaId: z.string(),
							active: z.boolean(),
							createdAt: z.string(),
							updatedAt: z.string(),
						}),
					),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const produtos = await prisma.produto.findMany({
				where: { revendaId },
				orderBy: { createdAt: "desc" },
			});
			return reply.send(
				produtos.map((p) => ({
					...p,
					createdAt: p.createdAt.toISOString(),
					updatedAt: p.updatedAt.toISOString(),
				})),
			);
		},
	);

	// Editar produto
	app.patch(
		"/api/products/:id",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Editar produto",
				params: z.object({ id: z.string() }),
				body: updateProductSchema,
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			const data = updateProductSchema.parse(request.body);
			// Só permite editar produtos da própria revenda
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}
			await prisma.produto.update({
				where: { id },
				data: {
					...data,
					description: data.description ?? produto.description,
					active: data.active ?? produto.active,
					name: data.name ?? produto.name,
				},
			});
			return reply.send({ success: true });
		},
	);

	// Deletar produto
	app.delete(
		"/api/products/:id",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Deletar produto",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({ success: z.boolean() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			// Só permite deletar produtos da própria revenda
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}
			await prisma.produto.delete({ where: { id } });
			return reply.send({ success: true });
		},
	);
}
