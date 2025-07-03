import { z } from "zod";

export const createAdminSchema = z.object({
	name: z.string().min(3),
	email: z.string().email(),
});

export const updateAdminSchema = z.object({
	name: z.string().optional(),
	email: z.string().email().optional(),
});
