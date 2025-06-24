import { z } from "zod";

export const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

export const resetPasswordSchema = z.object({
	token: z.string(),
	password: z
		.string()
		.min(12)
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
			"Senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.",
		),
});
