import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhdwy]$/, "Formato inválido. Use: 1s, 1m, 1h, 1d, 1w, 1y"),
  NODE_ENV: z.enum(["development", "production"]),
  API_VERSION: z.string().regex(/^v\d+$/, "Formato deve ser v1, v2, etc."),
  CORS_ORIGIN: z.string().url(),
  ASAAS_WEBHOOK_SECRET: z
    .string()
    .min(16, "ASAAS_WEBHOOK_SECRET deve ter pelo menos 16 caracteres"),
  EXTERNAL_API_URL: z.string().url(),
  EXTERNAL_API_TOKEN: z
    .string()
    .min(10, "EXTERNAL_API_TOKEN deve ter pelo menos 10 caracteres"),
});

// Validação das variáveis de ambiente
const ENV = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Erro na validação das variáveis de ambiente:");
    if (error instanceof z.ZodError) {
      // biome-ignore lint/complexity/noForEach: <explanation>
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.error(
      "\n💡 Verifique o arquivo .env e corrija as variáveis indicadas.",
    );
    process.exit(1);
  }
})();

console.log("✅ Variáveis de ambiente validadas com sucesso");

export default ENV;
export type Env = z.infer<typeof envSchema>;
