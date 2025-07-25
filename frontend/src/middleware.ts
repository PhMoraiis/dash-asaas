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
	const matched = match(languages, locales, defaultLocale);
	console.log("[middleware] 📍 getLocale:", matched);
	return matched;
}

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.includes(pathname) || pathname === "";
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	console.log("\n============================");
	console.log("[middleware] 🌐 pathname:", pathname);

	// Arquivos estáticos ou Next internals
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/public") ||
		pathname.match(/\.[^/]+$/)
	) {
		console.log("[middleware] ⛔ Ignorando rota estática");
		return NextResponse.next();
	}

	// Detecta locale na URL
	const pathnameHasLocale = locales.some(
		(locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (!pathnameHasLocale) {
		const locale = getLocale(request);
		let redirectPath = `/${locale}${pathname}`;
		if (pathname === "/") {
			redirectPath = `/${locale}`;
		}
		const url = new URL(request.url);
		url.pathname = redirectPath;
		console.log("[middleware] 🔀 Redirecionando para locale:", url.pathname);
		return NextResponse.redirect(url);
	}

	const locale =
		locales.find((loc) => pathname.startsWith(`/${loc}`)) || defaultLocale;
	const pathWithoutLocale = pathname.replace(`/${locale}`, "");

	console.log("[middleware] 🌍 Locale:", locale);
	console.log("[middleware] 🧱 pathWithoutLocale:", pathWithoutLocale);

	// Acesso público
	if (isPublicPath(pathWithoutLocale)) {
		console.log("[middleware] 🔓 Rota pública detectada");

		const token = request.cookies.get("auth_token")?.value;
		console.log("[middleware] 🍪 Token encontrado (público)?", !!token);

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
				console.log("[middleware] ✅ JWT válido:", { role, slug });

				if (role === "admin") {
					console.log("[middleware] 🚀 Redirecionando para painel admin");
					return NextResponse.redirect(
						new URL(`/${locale}/admin/${slug}/admins`, request.url),
					);
				}
				if (role === "revenda") {
					console.log("[middleware] 🚀 Redirecionando para painel revenda");
					return NextResponse.redirect(
						new URL(`/${locale}/revenda/${slug}/dashboard`, request.url),
					);
				}
			} catch (err) {
				console.warn("[middleware] ❌ Erro ao verificar JWT (rota pública):", err);
			}
		}
		return NextResponse.next();
	}

	// Acesso privado: precisa estar autenticado
	const token = request.cookies.get("auth_token")?.value;
	console.log("[middleware] 🔐 Rota protegida, token presente?", !!token);

	if (!token) {
		console.warn("[middleware] 🔁 Redirecionando para login (sem token)");
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	let role: string | null = null;
	let slug: string | null = null;
	const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET;

	if (!jwtSecret) {
		console.warn("[middleware] ❌ JWT_SECRET não encontrado");
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	try {
		const { payload } = await jwtVerify(
			token,
			new TextEncoder().encode(jwtSecret),
		);
		role = payload.role as string;
		slug = payload.slug as string;
		console.log("[middleware] ✅ JWT decodificado:", { role, slug });
	} catch (err) {
		console.warn("[middleware] ❌ Erro ao verificar JWT:", err);
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// --- NOVO BLOCO ---
	try {
		const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
			headers: { Cookie: `auth_token=${token}` },
			credentials: "include",
		});
		if (meRes.ok) {
			const user = await meRes.json();
			console.log("[middleware] 👤 User API:", user);
			if (
				user.mustChangePassword &&
				!pathname.startsWith(`/${locale}/new-password`)
			) {
				console.log("[middleware] 🔐 Redirecionando para troca de senha");
				const url = new URL(request.url);
				url.pathname = `/${locale}/new-password`;
				return NextResponse.redirect(url);
			}
		} else {
			console.warn("[middleware] ⚠️ Erro ao buscar /api/me:", meRes.status);
		}
	} catch (err) {
		console.warn("[middleware] ❌ Erro no fetch /api/me:", err);
	}
	// --- FIM NOVO BLOCO ---

	// Protege admin
	const adminMatch = pathWithoutLocale.match(/^\/admin\/([^/]+)/);
	if (adminMatch) {
		console.log("[middleware] 🛡️ Checando rota admin:", adminMatch[1]);
		if (role !== "admin" || adminMatch[1] !== slug) {
			console.warn("[middleware] ⛔ Acesso negado ao admin");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Protege revenda
	const revendaMatch = pathWithoutLocale.match(/^\/revenda\/([^/]+)/);
	if (revendaMatch) {
		console.log("[middleware] 🛡️ Checando rota revenda:", revendaMatch[1]);
		if (role !== "revenda" || revendaMatch[1] !== slug) {
			console.warn("[middleware] ⛔ Acesso negado à revenda");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	console.log("[middleware] ✅ Acesso autorizado");
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
