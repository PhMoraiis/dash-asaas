import { PrismaClient } from "@/generated/prisma";
import ENV from "../env";
import IORedis from "ioredis";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log:
			ENV.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});

if (ENV.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Conexão Redis (usada em filas e agora para refresh token)
export const redis = new IORedis(ENV.REDIS_URL);
