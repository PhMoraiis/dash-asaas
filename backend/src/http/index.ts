import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import ENV from "../env";
import "../queues/worker";
import { queueJobsRoutes } from "../routes/queueJobs";
import { registerLoggingHooks } from "../middlewares/logging";
import { registerErrorHandler } from "../middlewares/errorHandler";
import fastifyJwt from "@fastify/jwt";
import { authRoutes } from "../routes/auth";
import { forgotRoutes } from "../routes/forgot";
import cookie from "@fastify/cookie";
import { revendasRoutes } from "../routes/manageRevendas";

const app = Fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

registerLoggingHooks(app);
registerErrorHandler(app);

app.register(cors, {
	origin: ENV.CORS_ORIGIN,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(swagger, {
	openapi: {
		info: {
			title: "Dashboard Webhooks ASAAS",
			version: "1.0.0",
			description: "API documentation for Dashboard Webhooks ASAAS",
		},
		components: {
			securitySchemes: {
				apiKey: {
					type: "apiKey",
					name: "apiKey",
					in: "header",
				},
			},
		},
	},
});

app.register(ScalarApiReference, {
	routePrefix: `/${ENV.API_VERSION}/docs`,
	configuration: {
		title: "Dashboard Webhooks ASAAS",
		theme: "moon",
		url: "/openapi.json",
	},
});

app.register(cookie, {
	secret: ENV.COOKIE_SECRET, // Chave secreta para assinar cookies
	hook: "onRequest", // Assina cookies no início da requisição
	parseOptions: {
		expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // Expira em 7 dias
		secure: ENV.NODE_ENV === "production", // Usa cookies seguros em produção
		sameSite: "lax", // Protege contra CSRF
	},
});

// Registrar JWT
app.register(fastifyJwt, {
	secret: ENV.JWT_SECRET,
	cookie: {
		cookieName: "auth_token",
		signed: false, // Assina o cookie
	},
});

// Rotas de queueJobs
app.register(queueJobsRoutes);

// Rotas de autenticação
app.register(authRoutes);

// Rotas de recuperação de senha
app.register(forgotRoutes);

// Rotas de revendas
app.register(revendasRoutes);

// Iniciar servidor
async function start() {
	try {
		await app.listen({ port: ENV.PORT });
		console.log(`🚀 Server is running at http://localhost:${ENV.PORT}`);
		console.log(
			`📚 Documentation available at http://localhost:${ENV.PORT}/${ENV.API_VERSION}/docs`,
		);
		console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

start();
