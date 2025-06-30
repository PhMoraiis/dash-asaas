import { NextResponse, type NextRequest } from "next/server";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["", "/", "/login", "/register", "/forgot-password"];
const locales = ["pt", "en"];
const defaultLocale = "pt";

function getLocale(request: NextRequest): string {
	const negotiatorHeaders: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		negotiatorHeaders[key] = value;
	});
	const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
	return match(languages, locales, defaultLocale);
}

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.includes(pathname) || pathname === "";
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	console.log("=== [MIDDLEWARE] ===");
	console.log("Pathname:", pathname);

	// Permite acesso a arquivos estáticos e _next
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/public") ||
		pathname.match(/\.[^/]+$/)
	) {
		console.log("Acesso liberado: estático ou _next");
		return NextResponse.next();
	}

	// Se já tem prefixo de idioma, segue normalmente
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (!pathnameHasLocale) {
		const locale = getLocale(request);
		console.log("Redirecionando para locale:", locale);
		let redirectPath = `/${locale}${pathname}`;
		if (pathname === "/") {
			redirectPath = `/${locale}`;
		}
		// Mantém a query string ao redirecionar
		const url = new URL(request.url);
		url.pathname = redirectPath;
		// url.search já contém a query string original
		return NextResponse.redirect(url);
	}

	// Extrai o locale da URL
	const locale =
		locales.find((loc) => pathname.startsWith(`/${loc}`)) || defaultLocale;
	const pathWithoutLocale = pathname.replace(`/${locale}`, "");
	console.log("Locale:", locale, "Path sem locale:", pathWithoutLocale);

	// Permite acesso a rotas públicas
	if (isPublicPath(pathWithoutLocale)) {
		// Se está autenticado, redireciona para o dashboard correto
		const token = request.cookies.get("auth_token")?.value;
		console.log("Rota pública. Token:", token);
		if (token) {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET!;
				const { payload } = await jwtVerify(
					token,
					new TextEncoder().encode(jwtSecret),
				);
				const role = payload.role as string;
				const userId = payload.id as string;
				console.log("Token válido. Role:", role, "UserId:", userId);
				if (role === "admin") {
					console.log("Redirecionando para dashboard admin");
					return NextResponse.redirect(
						new URL(`/${locale}/admin/${userId}/dashboard`, request.url),
					);
				}
				if (role === "revenda") {
					console.log("Redirecionando para dashboard revenda");
					return NextResponse.redirect(
						new URL(`/${locale}/revenda/${userId}/dashboard`, request.url),
					);
				}
			} catch (e) {
				console.log("Token inválido:", e);
			}
		}
		console.log("Acesso liberado para rota pública");
		return NextResponse.next();
	}

	// Checa se existe cookie de autenticação
	const token = request.cookies.get("auth_token")?.value;
	console.log("Token recebido:", token);
	if (!token) {
		console.log("Sem token. Redirecionando para login.");
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Decodifica o JWT para saber o papel do usuário
	let role: string | null = null;
	let userId: string | null = null;
	try {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET!;
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(jwtSecret),
		);
		role = payload.role as string;
		userId = payload.id as string;
		console.log("Token decodificado. Role:", role, "UserId:", userId);
	} catch (e) {
		console.log("Token inválido ao decodificar:", e);
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Protege área de admin: apenas admin pode acessar /admin
	const adminMatch = pathWithoutLocale.match(/^\/admin\/([^/]+)/);
	if (adminMatch) {
		console.log("Tentando acessar área admin. URL id:", adminMatch[1]);
		if (role !== "admin" || adminMatch[1] !== userId) {
			console.log("Acesso negado à área admin. Redirecionando para login.");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Protege área de revendas: apenas revenda pode acessar /revenda
	const revendaMatch = pathWithoutLocale.match(/^\/revenda\/([^/]+)/);
	if (revendaMatch) {
		console.log("Tentando acessar área revenda. URL id:", revendaMatch[1]);
		if (role !== "revenda" || revendaMatch[1] !== userId) {
			console.log("Acesso negado à área revenda. Redirecionando para login.");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Se chegou aqui, está autenticado e pode acessar
	console.log("Acesso autenticado liberado.");
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
