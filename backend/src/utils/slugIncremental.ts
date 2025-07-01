import { prisma } from "@/database/client";
import slugify from "slugify";

type ModelType = "admin" | "revenda";

// Função para gerar slug único
export async function generateUniqueSlug(
	name: string,
	model: ModelType,
): Promise<string> {
	const baseSlug = slugify(name, { lower: true, strict: true });
	let slug = baseSlug;
	let count = 2;

	// Verifica se já existe
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let existe: any;
	do {
		existe = await (model === "admin"
			? prisma.admin.findUnique({ where: { slug } })
			: prisma.revenda.findUnique({ where: { slug } }));
		if (existe) {
			slug = `${baseSlug}-${count}`;
			count++;
		}
	} while (existe);
	return slug;
}
