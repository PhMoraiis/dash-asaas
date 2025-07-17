"use client";

import { HandWavingIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { getFirstName } from "@/lib/utils";
import { useDictionary } from "@/hooks/use-dictionary";

export function SignOutButton() {
	const logout = useAuthStore((s) => s.logout);
	const user = useAuthStore((s) => s.user);
	const router = useRouter();
	const dict = useDictionary();

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
		<Button
			variant="ghost"
			onClick={handleLogout}
			className="w-full justify-start px-0 cursor-pointer"
		>
			<div className="flex items-center gap-2">
				<div className="size-9 bg-border rounded-lg flex items-center justify-center">
					<SignOutIcon size={20} />
				</div>
				<span>{dict.sidebar.signOut}</span>
			</div>
		</Button>
	);
}
