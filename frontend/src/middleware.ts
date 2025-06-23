import { NextResponse, type NextRequest } from "next/server";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];
const ADMIN_PATH = "/admin";

const locales = ["pt", "en"];
const defaultLocale = "pt";

function getLocale(request: NextRequest): string {
	// O NextRequest não tem .headers como objeto simples, então convertemos:
	const negotiatorHeaders: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		negotiatorHeaders[key] = value;
	});

	// Negotiator espera um objeto com headers
	const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
	// Faz o match usando intl-localematcher
	return match(languages, locales, defaultLocale);
}

// Função para checar se a rota é pública
function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.some((p) => pathname.includes(p));
}

// Função para checar se a rota é admin
function isAdminPath(pathname: string) {
	return pathname.includes("/admin");
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (pathnameHasLocale) return;

	const locale = getLocale(request);
	request.nextUrl.pathname = `/${locale}${pathname}`;

	// Permite acesso a arquivos estáticos e _next
	if (pathname.startsWith("/_next") || pathname.match(/\\.[^/]+$/)) {
		return NextResponse.next();
	}

	// Permite acesso a rotas públicas
	if (isPublicPath(pathname)) {
		return NextResponse.next();
	}

	// Checa se existe cookie de autenticação
	const token = request.cookies.get("token")?.value;
	if (!token) {
		// Não autenticado, redireciona para login
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Se for rota admin, checa role
	if (isAdminPath(pathname)) {
		try {
			// Decodifica JWT (se for JWT puro, sem segredo)
			const { payload } = await jwtVerify(
				token,
				new TextEncoder().encode("SUA_SECRET_KEY"),
			);
			if (payload.role !== "admin") {
				// Não é admin, redireciona para dashboard
				return NextResponse.redirect(new URL("/dashboard", request.url));
			}
		} catch {
			// Token inválido, redireciona para login
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	// Se chegou aqui, está autenticado e pode acessar
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
