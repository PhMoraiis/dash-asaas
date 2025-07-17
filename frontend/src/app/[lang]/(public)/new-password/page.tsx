"use client";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeftIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth-store";
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

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Senha atual obrigatória."),
		newPassword: z
			.string()
			.min(12, "A nova senha deve ter pelo menos 12 caracteres.")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
				"A senha deve conter maiúscula, minúscula, número e símbolo (@$!%*?&#).",
			),
		confirm: z.string(),
	})
	.refine((data) => data.newPassword === data.confirm, {
		message: "As senhas não coincidem.",
		path: ["confirm"],
	});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const setUser = useAuthStore((s) => s.setUser);
	const params = useParams();
	const pathname = usePathname();
	const lang =
		typeof params?.lang === "string"
			? params.lang
			: Array.isArray(params?.lang)
				? params.lang[0]
				: "pt";
	const dict = useDictionary();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ChangePasswordForm>({
		resolver: zodResolver(changePasswordSchema),
		mode: "onTouched",
	});

	async function onSubmit(data: ChangePasswordForm) {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/change-password`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						currentPassword: data.currentPassword,
						newPassword: data.newPassword,
					}),
				},
			);
			if (!res.ok) {
				const result = await res.json();
				throw new Error(result.message || "Erro ao trocar a senha.");
			}
			// Atualiza o usuário no estado global
			const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
				credentials: "include",
			});
			if (meRes.ok) {
				const user = await meRes.json();
				setUser(user);
			}
			setSuccess(true);
			reset();
			setTimeout(() => {
				router.replace("/login");
			}, 2000);
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message || "Erro ao trocar a senha.");
			} else {
				setError("Erro ao trocar a senha.");
			}
		} finally {
			setLoading(false);
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
						<CardTitle className="text-3xl font-semibold">
							{dict.password.changeTitle}
						</CardTitle>
						<CardDescription className="text-md">
							{dict.password.changeSubtitle}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{success ? (
							<div className="text-green-600 text-center">
								{dict.password.success}
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="currentPassword">
											{dict.password.currentPassword}
										</Label>
										<Input
											id="currentPassword"
											type="password"
											{...register("currentPassword")}
											required
										/>
										{errors.currentPassword && (
											<span className="text-red-600 text-sm">
												{errors.currentPassword.message}
											</span>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="newPassword">
											{dict.password.newPassword}
										</Label>
										<Input
											id="newPassword"
											type="password"
											{...register("newPassword")}
											required
											minLength={12}
										/>
										{errors.newPassword && (
											<span className="text-red-600 text-sm">
												{errors.newPassword.message}
											</span>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirm">
											{dict.password.confirmNewPassword}
										</Label>
										<Input
											id="confirm"
											type="password"
											{...register("confirm")}
											required
											minLength={12}
										/>
										{errors.confirm && (
											<span className="text-red-600 text-sm">
												{errors.confirm.message}
											</span>
										)}
									</div>
								</div>
								{error && <div className="text-red-600 text-sm">{error}</div>}
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? (
										<CircleNotchIcon className="animate-spin" />
									) : (
										`${dict.password.change}`
									)}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
