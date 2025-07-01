"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
	const lang =
		typeof params?.lang === "string"
			? params.lang
			: Array.isArray(params?.lang)
				? params.lang[0]
				: "pt";
	const [error, setError] = useState("");

	async function onSubmit(values: { email: string; password: string }) {
		setError("");
		try {
			const res = await fetch("http://localhost:3333/api/login", {
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
				router.push(`/${lang}/admin/${user.slug}/dashboard`);
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

	return (
		<div className="min-h-screen relative">
			<Button
				onClick={() => router.push("/")}
				variant="ghost"
				className="cursor-pointer absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
				aria-label="Go to home page"
			>
				<ArrowLeftIcon /> Home
			</Button>
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md border-none shadow-none bg-background">
					<CardHeader className="space-y-1">
						<div className="flex justify-start mb-6">
							<WebhooksLogoIcon className="size-12 text-primary" />
						</div>
						<CardTitle className="text-3xl font-semibold">
							Bem vindo ao Dashboard Hook
						</CardTitle>
						<CardDescription className="text-md">
							Entre com sua conta para acessar o painel de controle.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form id="login" onSubmit={handleSubmit(onSubmit)}>
							<div className="space-y-2">
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
								<Label htmlFor="password" className="text-md font-semibold">
									Senha
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
										Entrar
									</div>
								)}
							</Button>
							<div className="mt-4">
								<p className="text-sm text-muted-foreground">
									Esqueceu sua senha?{" "}
									<Link
										className="text-primary hover:underline duration-200"
										href="/forgot-password"
									>
										Clique aqui
									</Link>
								</p>
							</div>
						</form>
						<Separator />
					</CardContent>
					<CardFooter className="flex">
						<p className="text-sm text-muted-foreground">
							By signing in, you agree to our{" "}
							<Link
								className="text-primary hover:underline duration-200"
								href={"/terms"}
							>
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link
								className="text-primary hover:underline duration-200"
								href={"/privacy"}
							>
								Privacy Policy
							</Link>
							.
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
