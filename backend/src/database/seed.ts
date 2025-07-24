import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { generateUniqueSlug } from "../utils/slugIncremental";

const prisma = new PrismaClient();

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";
	const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456!@#";
	const adminName = process.env.ADMIN_NAME || "Administrador";

	// Verifica se já existe admin
	const exists = await prisma.admin.findFirst();
	if (!exists) {
		const hashed = await hash(adminPassword, 12);
		const slug = await generateUniqueSlug(adminName, "admin");
		await prisma.admin.create({
			data: {
				name: adminName,
				email: adminEmail,
				password: hashed,
				slug,
				mustChangePassword: true,
				active: true,
			},
		});
		console.log("Admin criado com sucesso!");
	} else {
		console.log("Admin já existe, seed não criou novo admin.");
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		process.exit(0);
	});
