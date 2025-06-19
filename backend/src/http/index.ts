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
import { protectRoute } from "../middlewares/jwt";
import { zodExampleRoutes } from "../routes/zodExample";

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
		servers: [
			{
				url: `http://localhost:${ENV.PORT}`,
				description: "Local development server",
			},
		],
		tags: [
			{
				name: "webhooks",
				description: "Webhook-related endpoints",
			},
		],
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

// Registrar JWT
app.register(fastifyJwt, {
	secret: ENV.JWT_SECRET,
});

// Registrar rotas de queueJobs
app.register(queueJobsRoutes);

// Registrar rotas de zodExample
app.register(zodExampleRoutes);

// Exemplo de rota protegida e validada com Zod
app.get(
	"/private-test",
	{ preHandler: protectRoute },
	async (request, reply) => {
		return reply.send({ message: "Acesso autorizado!", user: request.user });
	},
);

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
