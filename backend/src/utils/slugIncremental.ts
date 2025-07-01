import { prisma } from "@/database/client";
import slugify from "slugify";

type ModelType = "admin" | "revenda";

const STOPWORDS = ["de", "da", "do", "dos", "das", "e"];

function removeStopwords(name: string) {
  return name
  .split(" ")
  .filter((word) => !STOPWORDS.includes(word.toLowerCase()))
  .join(" ");
}

// Função para gerar slug único
export async function generateUniqueSlug(
	name: string,
	model: ModelType,
): Promise<string> {
	const cleanName = removeStopwords(name);
	const baseSlug = slugify(cleanName, { lower: true, strict: true });
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
