"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const resetPasswordSchema = z
	.object({
		password: z.string().min(12, "Password must be at least 12 characters."),
		confirm: z.string(),
	})
	.refine((data) => data.password === data.confirm, {
		message: "Passwords do not match.",
		path: ["confirm"],
	});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordForm>({
		resolver: zodResolver(resetPasswordSchema),
		mode: "onTouched",
	});

	async function onSubmit(data: ResetPasswordForm) {
		setLoading(true);
		setError("");
		const res = await fetch("http://localhost:3333/api/reset-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, password: data.password }),
		});
		if (res.ok) {
			setSuccess(true);
		} else {
			const result = await res.json();
			setError(result.message || "Could not reset password.");
		}
		setLoading(false);
	}

	return (
		<div className="min-h-screen relative">
			<Button
				onClick={() => router.push("/")}
				variant="ghost"
				className="absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
				aria-label="Go to home page"
			>
				<ArrowLeftIcon /> Home
			</Button>
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md border-none shadow-none bg-background">
					<CardHeader className="space-y-1">
						<CardTitle className="text-3xl font-semibold">
							Redefina sua senha
						</CardTitle>
						<CardDescription className="text-md">
							Por favor, insira sua nova senha abaixo. A senha deve ter pelo
							menos 12 caracteres.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{success ? (
							<div className="text-green-600 text-center">
								Your password has been reset successfully.
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="password">Nova senha</Label>
									<Input
										id="password"
										type="password"
										{...register("password")}
										required
										minLength={12}
										autoFocus
									/>
									{errors.password && (
										<span className="text-red-600 text-sm">
											{errors.password.message}
										</span>
									)}
									<Label htmlFor="confirm">Confirme sua senha</Label>
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
								{error && <div className="text-red-600 text-sm">{error}</div>}
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "Resetting..." : "Reset password"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
