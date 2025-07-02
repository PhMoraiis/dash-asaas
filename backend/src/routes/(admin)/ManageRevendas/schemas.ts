import { z } from "zod";

export const createRevendaSchema = z.object({
	name: z.string().min(3),
	email: z.string().email(),
});

export const updateRevendaSchema = z.object({
	name: z.string().min(3).optional(),
	email: z.string().email().optional(),
	password: z
		.string()
		.min(
			12,
			"Senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos (@$!%*?&#).",
		)
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
		)
		.optional(),
});
