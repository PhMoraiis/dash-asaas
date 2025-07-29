import { match } from "@formatjs/intl-localematcher";
import { jwtVerify } from "jose";
import Negotiator from "negotiator";
import { type NextRequest, NextResponse } from "next/server";

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
	return matched;
}

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.includes(pathname) || pathname === "";
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Arquivos estáticos ou Next internals
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/public") ||
		pathname.match(/\.[^/]+$/)
	) {
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
		return NextResponse.redirect(url);
	}

	const locale =
		locales.find((loc) => pathname.startsWith(`/${loc}`)) || defaultLocale;
	const pathWithoutLocale = pathname.replace(`/${locale}`, "");


	// Acesso público
	if (isPublicPath(pathWithoutLocale)) {

		const token = request.cookies.get("auth_token")?.value;
			Object.fromEntries(request.cookies)

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

				// Verificar mustChangePassword aqui também
				try {
					const meRes = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}/api/me`,
						{
							headers: {
								Cookie: request.headers.get("cookie") || "",
								"Content-Type": "application/json",
							},
							credentials: "include",
						},
					);

					if (meRes.ok) {
						const user = await meRes.json();

						// Se deve trocar senha, redireciona para new-password
						if (user.mustChangePassword) {
							return NextResponse.redirect(
								new URL(`/${locale}/new-password`, request.url),
							);
						}
					}
				} catch (err) {
					console.warn("[middleware] ❌ Erro no fetch /api/me (público):", err);
				}

				// Se não precisa trocar senha, redireciona para dashboard
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
			} catch (err) {
				console.warn(
					"[middleware] ❌ Erro ao verificar JWT (rota pública):",
					err,
				);
			}
		}
		return NextResponse.next();
	}

	// Acesso privado: precisa estar autenticado
	const token = request.cookies.get("auth_token")?.value;
		Object.fromEntries(request.cookies)

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
	} catch (err) {
		console.warn("[middleware] ❌ Erro ao verificar JWT:", err);
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Verificar mustChangePassword para todas as rotas privadas
	try {
		const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
			headers: {
				Cookie: request.headers.get("cookie") || "",
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (meRes.ok) {
			const user = await meRes.json();

			if (user.mustChangePassword) {
				// Se deve trocar senha e NÃO está na página new-password, redireciona
				if (!pathname.startsWith(`/${locale}/new-password`)) {
					return NextResponse.redirect(
						new URL(`/${locale}/new-password`, request.url),
					);
				}
			} else {
				// Se NÃO deve trocar senha e está na página new-password, redireciona para dashboard
				if (pathname.startsWith(`/${locale}/new-password`)) {
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
				}
			}
		} else {
			console.warn("[middleware] ⚠️ Erro ao buscar /api/me:", meRes.status);
			// Se não conseguir verificar o usuário, redireciona para login
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	} catch (err) {
		console.warn("[middleware] ❌ Erro no fetch /api/me:", err);
		// Se não conseguir verificar o usuário, redireciona para login
		return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
	}

	// Se chegou até aqui e está na página new-password, permite acesso (para casos onde mustChangePassword = true)
	if (pathname.startsWith(`/${locale}/new-password`)) {
		return NextResponse.next();
	}

	// Protege admin
	const adminMatch = pathWithoutLocale.match(/^\/admin\/([^/]+)/);
	if (adminMatch) {
		if (role !== "admin" || adminMatch[1] !== slug) {
			console.warn("[middleware] ⛔ Acesso negado ao admin");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	// Protege revenda
	const revendaMatch = pathWithoutLocale.match(/^\/revenda\/([^/]+)/);
	if (revendaMatch) {
		if (role !== "revenda" || revendaMatch[1] !== slug) {
			console.warn("[middleware] ⛔ Acesso negado à revenda");
			return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
