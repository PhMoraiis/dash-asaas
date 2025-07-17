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
import {
	ArrowLeftIcon,
	CheckCircleIcon,
	CircleNotchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDictionary } from "@/hooks/use-dictionary";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface ForgotForm {
	email: string;
}

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

const languages = [
	{ value: "en", label: "En", flag: "/eua.svg" },
	{ value: "pt", label: "Pt", flag: "/br.svg" },
];

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const dict = useDictionary();
	const pathname = usePathname();
	const params = useParams();

	const lang =
		typeof params?.lang === "string"
			? params.lang
			: Array.isArray(params?.lang)
				? params.lang[0]
				: "pt";

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
		await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: data.email }),
		});
		setSent(true);
		setLoading(false);
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
			<div className="flex justify-between items-center">
				<div>
					<Button
						onClick={() => router.back()}
						variant="ghost"
						className="absolute top-4 left-4 rounded-2xl gap-2 hover:bg-border"
						aria-label="Go to home page"
					>
						<ArrowLeftIcon /> {dict.forgot.back}
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
							{dict.forgot.title}
						</CardTitle>
						{sent ? (
							""
						) : (
							<CardDescription className="text-md">
								{dict.forgot.subtitle}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						{sent ? (
							<div className="text-green-600 text-left">
								<div className="flex items-start gap-4">
									<CheckCircleIcon className="size-12" />
									<p>{dict.forgot.success}</p>
								</div>
								{/* biome-ignore lint/a11y/useKeyWithClickEvents: ignore */}
								{/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
								<span
									className="text-primary cursor-pointer mt-4 flex items-center gap-2"
									onClick={() => router.push("/login")}
								>
									<ArrowLeftIcon /> {dict.forgot.backToLogin}
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
									{loading ? (
										<CircleNotchIcon className="animate-spin" />
									) : (
										`${dict.forgot.sendLink}`
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
