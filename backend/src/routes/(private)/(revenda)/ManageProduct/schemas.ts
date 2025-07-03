import { z } from "zod";

export const createProductSchema = z.object({
	name: z.string().min(2, "Nome obrigatório"),
	description: z.string().optional(),
});

export const updateProductSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	active: z.boolean().optional(),
});
