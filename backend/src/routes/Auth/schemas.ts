import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(
			12,
			"Senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos (@$!%*?&#).",
		)
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
		),
});
