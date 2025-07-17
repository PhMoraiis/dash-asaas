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

	// Permite acesso a rotas públicas
	if (isPublicPath(pathWithoutLocale)) {
		// Se está autenticado, redireciona para o dashboard correto
		const token = request.cookies.get("auth_token")?.value;
		if (token) {
			try {
				// biome-ignore lint/style/noNonNullAssertion: ignore
				const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET!;
				const { payload } = await jwtVerify(
					token,
					new TextEncoder().encode(jwtSecret),
				);
				const role = payload.role as string;
				const slug = payload.slug as string;
				if (role === "admin") {
					return NextResponse.redirect(
						new URL(`/${locale}/admin/${slug}/admins`, request.url),
					);
				}
				if (role === "revenda") {
					return NextResponse.redirect(
						new URL(`/${locale}/revenda/${slug}/dashboard`, request.url),
					);
				}
			} catch (_e) {}
		}
		return NextResponse.next();
	}

	// Checa se existe cookie de autenticação
	const token = request.cookies.get("auth_token")?.value;
	if (!token) {
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Decodifica o JWT para saber o papel do usuário
	let role: string | null = null;
	let slug: string | null = null;
	const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET;
	if (!jwtSecret) {
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}
	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(jwtSecret),
		);
		role = payload.role as string;
		slug = payload.slug as string;
	} catch (_e) {
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// --- NOVO: Consulta o backend para saber se precisa trocar a senha ---
	try {
		const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
			headers: { Cookie: `auth_token=${token}` },
			credentials: "include",
		});
		if (meRes.ok) {
			const user = await meRes.json();
			if (
				user.mustChangePassword &&
				!pathname.startsWith(`/${locale}/new-password`)
			) {
				const url = new URL(request.url);
				url.pathname = `/${locale}/new-password`;
				return NextResponse.redirect(url);
			}
		}
	} catch {}
	// --- FIM NOVO ---

	// Protege área de admin: apenas admin pode acessar /admin
	const adminMatch = pathWithoutLocale.match(/^\/admin\/([^/]+)/);
	if (adminMatch) {
		if (role !== "admin" || adminMatch[1] !== slug) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Protege área de revendas: apenas revenda pode acessar /revenda
	const revendaMatch = pathWithoutLocale.match(/^\/revenda\/([^/]+)/);
	if (revendaMatch) {
		if (role !== "revenda" || revendaMatch[1] !== slug) {
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Se chegou aqui, está autenticado e pode acessar
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
