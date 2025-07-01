"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import {
	HandWavingIcon,
	SunIcon,
	SunHorizonIcon,
	MoonStarsIcon,
} from "@phosphor-icons/react/dist/ssr";

import Logo from "@/components/navbar/logo";
import ThemeToggle from "@/components/navbar/theme-toggle";
import UserMenu from "@/components/navbar/user-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { CommandBar } from "./command-bar";

// Language options
const languages = [
	{ value: "en", label: "En", flag: "/eua.svg" },
	{ value: "pt", label: "Pt", flag: "/br.svg" },
];

const getFormattedDate = () => {
	const now = new Date();
	return now.toLocaleDateString("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "long",
	});
};

export default function Navbar() {
	const id = useId();
	const [selectedLang, setSelectedLang] = useState("pt");
	const user = useAuthStore((s) => s.user);
	const [greeting, setGreeting] = useState("");
	const [GreetingIcon, setGreetingIcon] = useState(() => HandWavingIcon);
	const [iconColor, setIconColor] = useState("#E4B273");

	useEffect(() => {
		if (!user?.name) return;
		setGreeting(`Bem vindo de volta, ${user.name}!`);
		setGreetingIcon(() => HandWavingIcon);
		setIconColor("#E4B273");

		const timer = setTimeout(() => {
			const hour = new Date().getHours();
			let saudacao = "Bom dia";
			let Icon = SunIcon;
			let color = "#FCC321";

			if (hour >= 12 && hour < 18) {
				saudacao = "Boa tarde";
				Icon = SunHorizonIcon;
				color = "#FF7C17";
			} else if (hour >= 18 || hour < 5) {
				saudacao = "Boa noite";
				Icon = MoonStarsIcon;
				color = "#60a5fa";
			}
			setGreeting(`${saudacao}, ${user.name}!`);
			setGreetingIcon(() => Icon);
			setIconColor(color);
		}, 120000);

		return () => clearTimeout(timer);
	}, [user?.name]);

	return (
		<header className="border-b px-4 md:px-6">
			<div className="flex h-16 items-center justify-between gap-2">
				{/* Left side */}
				<div className="flex items-center gap-6">
					{/* Logo e outras infos */}
					<Link
						href="/"
						className="text-primary hover:text-primary/90 block md:hidden"
					>
						<Logo />
					</Link>
					<Separator
						orientation="vertical"
						className="data-[orientation=vertical]:h-4 block md:hidden"
					/>
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="data-[orientation=vertical]:h-4 hidden md:flex"
					/>
					<div className="hidden md:flex items-start justify-center flex-col p-2 my-4">
						<h1 className="flex items-center justify-center gap-2 text-md font-semibold">
							{greeting}{" "}
							<GreetingIcon weight="fill" size={22} color={iconColor} />
						</h1>
						<span className="text-sm text-popover-foreground">
							{getFormattedDate().charAt(0).toUpperCase() +
								getFormattedDate().slice(1)}
						</span>
					</div>
				</div>
				{/* Right side */}
				<div className="flex items-center gap-2">
					<CommandBar />
					<ThemeToggle />
					{/* Language selector */}
					<Select defaultValue={selectedLang} onValueChange={setSelectedLang}>
						<SelectTrigger
							id={`language-${id}`}
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
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
