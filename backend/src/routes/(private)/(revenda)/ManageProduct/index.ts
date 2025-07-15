import type { FastifyInstance } from "fastify";
import { prisma } from "@/database/client";
import { protectRoute } from "@/middlewares/jwt";
import { requireRole } from "@/middlewares/role";
import { createProductSchema, updateProductSchema } from "./schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import ENV from "@/env";

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
						webhookToken: z.string(),
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
			const webhookToken = randomUUID();
			const produto = await prisma.produto.create({
				data: { ...data, revendaId, webhookToken },
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
							webhookToken: z.string(),
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

	// Ativar ou desativar produto (soft delete/reativar)
	app.patch(
		"/api/products/:id/status",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products", "revendas"],
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
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			const { active } = request.body as { active: boolean };
			// Só permite alterar o status de produtos da própria revenda
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}
			try {
				await prisma.produto.update({
					where: { id, revendaId },
					data: { active },
				});
				return reply.send({ success: true });
			} catch (_e) {
				return reply
					.status(404)
					.send({ error: true, message: "Revenda não encontrada" });
			}
		},
	);

	// Deletar produto
	app.delete(
		"/api/products/:id/force",
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

	// Regenerar token de webhook do produto
	app.post(
		"/api/produtos/:id/regenerate",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Regenerar token de webhook do produto",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({ webhookToken: z.string() }),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { id: revendaId } = request.user as { id: string };

			// Garante que o produto pertence à revenda logada
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}

			const novoToken = randomUUID();
			await prisma.produto.update({
				where: { id },
				data: { webhookToken: novoToken },
			});

			return reply.send({ webhookToken: novoToken });
		},
	);

	// Obter configuração de webhook do produto
	app.get(
		"/api/produtos/:id/webhook-config",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Obter configuração de webhook do produto",
				params: z.object({ id: z.string() }),
				response: {
					200: z.object({
						webhookUrl: z.string(),
						webhookToken: z.string(),
					}),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { id: revendaId } = request.user as { id: string };

			// Garante que o produto pertence à revenda logada
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}

			const webhookUrl = `${ENV.EXTERNAL_API_URL}/api/webhooks/asaas`;
			return reply.send({ webhookUrl, webhookToken: produto.webhookToken });
		},
	);

	// Buscar detalhes de um produto específico da revenda logada
	app.get(
		"/api/products/:id",
		{
			preHandler: [protectRoute, requireRole("revenda")],
			schema: {
				tags: ["products"],
				summary: "Buscar detalhes de um produto da revenda logada",
				params: z.object({ id: z.string() }),
				response: {
					200: createProductSchema.extend({
						id: z.string(),
						revendaId: z.string(),
						active: z.boolean(),
						createdAt: z.string(),
						updatedAt: z.string(),
						webhookToken: z.string(),
					}),
					404: z.object({ error: z.boolean(), message: z.string() }),
				},
			},
		},
		async (request, reply) => {
			const { id: revendaId } = request.user as { id: string };
			const { id } = request.params as { id: string };
			const produto = await prisma.produto.findFirst({
				where: { id, revendaId },
			});
			if (!produto) {
				return reply
					.status(404)
					.send({ error: true, message: "Produto não encontrado" });
			}
			return reply.send({
				...produto,
				createdAt: produto.createdAt.toISOString(),
				updatedAt: produto.updatedAt.toISOString(),
			});
		},
	);
}
