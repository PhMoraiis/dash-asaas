"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
	ArrowLeftIcon,
	CircleNotchIcon,
	MagicWandIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react/ssr";
import { useForm } from "react-hook-form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useDictionary } from "@/hooks/use-dictionary";

const languages = [
	{ value: "en", label: "En", flag: "/eua.svg" },
	{ value: "pt", label: "Pt", flag: "/br.svg" },
];

export default function LoginPage() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { email: "", password: "" },
	});
	const login = useAuthStore((s) => s.login);
	const setUser = useAuthStore((s) => s.setUser);
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	const lang =
		typeof params?.lang === "string"
			? params.lang
			: Array.isArray(params?.lang)
				? params.lang[0]
				: "pt";
	const [error, setError] = useState("");
	const dict = useDictionary();

	async function onSubmit(values: { email: string; password: string }) {
		setError("");
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
				credentials: "include",
			});
			if (!res.ok) throw new Error("Login inválido");
			const data = await res.json();
			const user = {
				id: data.id,
				name: data.name,
				email: data.email,
				role: data.role,
				slug: data.slug,
			};
			login(user);
			setUser(user);
			if (data.mustChangePassword) {
				router.push(`/${lang}/new-password`);
				return;
			}
			if (user.role === "admin") {
				router.push(`/${lang}/admin/${user.slug}/admins`);
			} else {
				router.push(`/${lang}/revenda/${user.slug}/dashboard`);
			}
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message || "Erro ao logar");
			} else {
				setError("Erro ao logar");
			}
		}
	}

	// Atualiza o idioma na URL ao trocar o select
	const handleChangeLang = (lang: string) => {
		const segments = pathname.split("/");
		if (segments[1] === "pt" || segments[1] === "en") {
			segments[1] = lang;
		} else {
			segments.splice(1, 0, lang);
		}
		const newPath = segments.join("/");
		router.push(newPath);
	};

	return (
		<div className="min-h-screen relative">
			<div className="flex items-center justify-between">
				<div>
					<Button
						onClick={() => router.push("/")}
						variant="ghost"
						className="cursor-pointer absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
						aria-label="Go to home page"
					>
						<ArrowLeftIcon /> Home
					</Button>
				</div>
				<div className="flex items-center justify-center p-4">
					<Select value={lang} onValueChange={handleChangeLang}>
						<SelectTrigger
							className="[&>svg]:text-muted-foreground/80 hover:bg-accent hover:text-accent-foreground h-8 border-none px-2 shadow-none [&>svg]:shrink-0"
							aria-label="Select language"
						>
							<SelectValue className="hidden sm:inline-flex" />
						</SelectTrigger>
						<SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
							{languages.map((lang) => (
								<SelectItem key={lang.value} value={lang.value}>
									<span className="flex items-center gap-2">
										<Image
											src={lang.flag}
											alt={lang.label}
											width={20}
											height={20}
										/>
										<span className="truncate">{lang.label}</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md border-none shadow-none bg-background">
					<CardHeader className="space-y-1">
						<div className="flex justify-start mb-6">
							<WebhooksLogoIcon className="size-12 text-primary" />
						</div>
						<CardTitle className="text-3xl font-semibold">
							{dict.auth.loginTitle}
						</CardTitle>
						<CardDescription className="text-md">
							{dict.auth.loginSubtitle}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form id="login" onSubmit={handleSubmit(onSubmit)}>
							<div className="space-y-2">
								<div>
									<Label htmlFor="email" className="text-md font-semibold">
										Email
									</Label>
									<Input
										id="email"
										placeholder="ada.lovelace@example.com"
										type="email"
										autoFocus
										autoComplete="email"
										{...register("email", { required: "Email obrigatório" })}
										aria-invalid={!!errors.email}
									/>
									{errors.email && (
										<span className="text-red-500 text-xs">
											{errors.email.message as string}
										</span>
									)}
								</div>
								<div>
									<Label htmlFor="password" className="text-md font-semibold">
										{dict.auth.password}
									</Label>
									<Input
										id="password"
										placeholder="************"
										type="password"
										{...register("password", { required: "Senha obrigatória" })}
										aria-invalid={!!errors.password}
									/>
									{errors.password && (
										<span className="text-red-500 text-xs">
											{errors.password.message as string}
										</span>
									)}
								</div>
							</div>
							{error && (
								<div className="text-red-500 text-sm mt-2">{error}</div>
							)}
							<Button
								type="submit"
								className="w-full mt-4 gap-4"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<CircleNotchIcon size={22} className="animate-spin" />
								) : (
									<div className="flex items-center justify-center">
										<MagicWandIcon className="mr-2 h-4 w-4" />
										{dict.auth.signIn}
									</div>
								)}
							</Button>
							<div className="mt-4">
								<p className="text-sm text-muted-foreground">
									{dict.auth.forgotPassword}{" "}
									<Link
										className="text-primary hover:underline duration-200"
										href="/forgot-password"
									>
										{dict.auth.forgotPasswordLink}
									</Link>
								</p>
							</div>
						</form>
						<Separator />
					</CardContent>
					<CardFooter className="flex">
						<p className="text-sm text-muted-foreground">
							{dict.auth.terms}{" "}
							<Link
								className="text-primary hover:underline duration-200"
								href={"/terms"}
							>
								{dict.auth.termsOfService}
							</Link>{" "}
							{dict.auth.and}{" "}
							<Link
								className="text-primary hover:underline duration-200"
								href={"/privacy"}
							>
								{dict.auth.privacyPolicy}
							</Link>
							.
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
