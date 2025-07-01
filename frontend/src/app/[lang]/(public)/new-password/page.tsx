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
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth-store";

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
			const res = await fetch("http://localhost:3333/api/change-password", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					currentPassword: data.currentPassword,
					newPassword: data.newPassword,
				}),
			});
			if (!res.ok) {
				const result = await res.json();
				throw new Error(result.message || "Erro ao trocar a senha.");
			}
			// Atualiza o usuário no estado global
			const meRes = await fetch("http://localhost:3333/api/me", {
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

	return (
		<div className="min-h-screen relative">
			<Button
				onClick={() => router.push("/")}
				variant="ghost"
				className="absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
				aria-label="Ir para home"
			>
				<ArrowLeftIcon /> Home
			</Button>
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md border-none shadow-none bg-background">
					<CardHeader className="space-y-1">
						<CardTitle className="text-3xl font-semibold">
							Troque sua senha
						</CardTitle>
						<CardDescription className="text-md">
							Por segurança, defina uma nova senha para acessar o sistema.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{success ? (
							<div className="text-green-600 text-center">
								Senha alterada com sucesso! Redirecionando...
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="currentPassword">Senha atual</Label>
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
										<Label htmlFor="newPassword">Nova senha</Label>
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
										<Label htmlFor="confirm">Confirme a nova senha</Label>
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
										"Trocar senha"
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
