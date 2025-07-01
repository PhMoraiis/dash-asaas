"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFirstName, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
	BookOpenIcon,
	HandWavingIcon,
	LifebuoyIcon,
	SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const avatarStyles = [
	"adventurer-neutral",
	"avataaars-neutral",
	"big-ears-neutral",
	"bottts-neutral",
	"fun-emoji",
	"dylan",
	"thumbs",
];

function randomStyle() {
	const idx = Math.floor(Math.random() * avatarStyles.length);
	return avatarStyles[idx];
}

export default function UserMenu() {
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const router = useRouter();
	const dicebearUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(user?.name || "User")}`;

	const [style, setStyle] = useState<string | null>(null);

	useEffect(() => {
		// Tenta pegar o estilo salvo no localStorage
		let savedStyle =
			typeof window !== "undefined"
				? localStorage.getItem("avatarStyle")
				: null;
		if (!savedStyle) {
			// Se não existir, sorteia e salva
			savedStyle = randomStyle();
			if (typeof window !== "undefined") {
				localStorage.setItem("avatarStyle", savedStyle);
			}
		}
		setStyle(savedStyle);
	}, []);

	if (!style) return null;

	async function handleLogout() {
		await logout();
		toast(`Até breve ${getFirstName(user?.name)}!`, {
			duration: 2000,
			closeButton: true,
			icon: <HandWavingIcon size={22} />,
			style: {
				backgroundColor: "var(--destructive)",
				color: "var(--destructive-foreground)",
			},
		});
		router.replace("/login");
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="h-auto p-0 hover:bg-transparent relative"
				>
					<Avatar>
						<AvatarImage src={dicebearUrl} alt="Avatar gerado" />
						<AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
					</Avatar>
					<span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
						<span className="sr-only">Online</span>
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="max-w-64" align="end">
				<DropdownMenuLabel className="flex min-w-0 flex-col">
					<span className="text-foreground truncate text-sm font-medium">
						{user?.name}
					</span>
					<span className="text-muted-foreground truncate text-xs font-normal">
						{user?.email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<LifebuoyIcon size={16} className="opacity-60" aria-hidden="true" />
						<span>Ajuda</span>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<BookOpenIcon size={16} className="opacity-60" aria-hidden="true" />
						<span>Docs</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>
					<SignOutIcon size={16} className="opacity-60" aria-hidden="true" />
					<span>Logout</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
