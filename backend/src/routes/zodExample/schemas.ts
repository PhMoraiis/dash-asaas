import { z } from "zod";

export const zodExampleBodySchema = z.object({
	nome: z.string().min(3),
	idade: z.number().int().positive(),
});

export const zodExampleQuerySchema = z.object({
	admin: z.boolean().optional(),
});
