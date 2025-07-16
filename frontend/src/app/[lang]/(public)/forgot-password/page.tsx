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
import { ArrowLeftIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ForgotForm {
	email: string;
}

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm<ForgotForm>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: "onTouched",
	});

	async function onSubmit(data: ForgotForm) {
		setLoading(true);
		await fetch("http://localhost:3333/api/forgot-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: data.email }),
		});
		setSent(true);
		setLoading(false);
	}

	return (
		<div className="min-h-screen relative">
			<Button
				onClick={() => router.back()}
				variant="ghost"
				className="absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
				aria-label="Go to home page"
			>
				<ArrowLeftIcon /> Voltar
			</Button>
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md border-none shadow-none bg-background">
					<CardHeader className="space-y-1">
						<CardTitle className="text-3xl font-semibold">
							Recuperação de senha
						</CardTitle>
						{sent ? (
							""
						) : (
							<CardDescription className="text-md">
								Insira seu e-mail para receber um link de recuperação de senha.
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						{sent ? (
							<div className="text-green-600 text-left">
								<div className="flex items-start gap-4">
									<CheckCircleIcon className="size-12" />
									<p>
										Um link de recuperação foi enviado para o seu e-mail,
										verifique sua caixa de entrada.
									</p>
								</div>
								{/* biome-ignore lint/a11y/useKeyWithClickEvents: ignore */}
								{/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
								<span
									className="text-primary cursor-pointer mt-4 flex items-center gap-2"
									onClick={() => router.push("/login")}
								>
									<ArrowLeftIcon /> Retornar para o Login
								</span>
							</div>
						) : (
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										{...register("email")}
										required
										placeholder="ada.lovelace@example.com"
										autoFocus
									/>
									{errors.email && (
										<span className="text-red-600 text-sm">
											{errors.email.message}
										</span>
									)}
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "Sending..." : "Send reset link"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
