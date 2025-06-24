import { NextResponse, type NextRequest } from "next/server";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];
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
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.endsWith(p));
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Permite acesso a arquivos estáticos e _next
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/public") ||
		pathname.match(/\.[^/]+$/)
	) {
		return NextResponse.next();
	}

	// Se já tem prefixo de idioma, segue normalmente
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (!pathnameHasLocale) {
		const locale = getLocale(request);
		let redirectPath = `/${locale}${pathname}`;
		if (pathname === "/") {
			redirectPath = `/${locale}/login`;
		}
		return NextResponse.redirect(new URL(redirectPath, request.url));
	}

	// Extrai o locale da URL
	const locale =
		locales.find((loc) => pathname.startsWith(`/${loc}`)) || defaultLocale;
	const pathWithoutLocale = pathname.replace(`/${locale}`, "");

	// Permite acesso a rotas públicas
	if (isPublicPath(pathWithoutLocale)) {
		console.log("Rota pública liberada pelo middleware:", pathWithoutLocale);
		return NextResponse.next();
	}

	// Checa se existe cookie de autenticação
	const token = request.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Decodifica o JWT para saber o papel do usuário
	let role: string | null = null;
	let userId: string | null = null;
	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode("dev-jwt-secret-change-in-production-123456789"),
		);
		role = payload.role as string;
		userId = payload.id as string;
		console.log("JWT payload:", payload);
	} catch {
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Protege área de admin: apenas admin pode acessar /admin
	const adminMatch = pathWithoutLocale.match(/^\/admin\/([^\/]+)/);
	if (adminMatch) {
		console.log("adminId na URL:", adminMatch[1]);
		if (role !== "admin" || adminMatch[1] !== userId) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Protege área de revendas: apenas revenda pode acessar /revenda
	const revendaMatch = pathWithoutLocale.match(/^\/revenda\/([^\/]+)/);
	if (revendaMatch) {
		console.log("revendaId na URL:", revendaMatch[1]);
		if (role !== "revenda" || revendaMatch[1] !== userId) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Se chegou aqui, está autenticado e pode acessar
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
