import { z } from "zod";

const passwordSchema = z
	.string()
	.min(
		12,
		"Senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos (@$!%*?&#).",
	)
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
		"A senha deve conter maiúscula, minúscula, número e símbolo (@$!%*?&#).",
	);

export function generateRandomPassword(length = 12): string {
	const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const lower = "abcdefghijklmnopqrstuvwxyz";
	const numbers = "0123456789";
	const symbols = "@$!%*?&#";
	const all = upper + lower + numbers + symbols;

	while (true) {
		// Garante pelo menos um de cada
		const password = [
			upper[Math.floor(Math.random() * upper.length)],
			lower[Math.floor(Math.random() * lower.length)],
			numbers[Math.floor(Math.random() * numbers.length)],
			symbols[Math.floor(Math.random() * symbols.length)],
		];

		for (let i = password.length; i < length; i++) {
			password.push(all[Math.floor(Math.random() * all.length)]);
		}

		// Embaralha a senha
		const generated = password.sort(() => Math.random() - 0.5).join("");
		const result = passwordSchema.safeParse(generated);
		if (result.success) {
			return generated;
		}
		// Se não passar, tenta novamente
	}
}
