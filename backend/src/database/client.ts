import { PrismaClient } from "@prisma/client";
import IORedis from "ioredis";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Conexão Redis (usada em filas e agora para refresh token)
if (!process.env.REDIS_URL) {
	throw new Error("REDIS_URL não definido nas variáveis de ambiente!");
}
export const redis = new IORedis(process.env.REDIS_URL);
