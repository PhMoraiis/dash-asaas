"use client";

import {
	CheckerboardIcon,
	IdentificationBadgeIcon,
	FolderUserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { NavMain } from "@/components/dashboard/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import Logo from "../navbar/logo";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import { useAuthStore } from "@/stores/auth-store";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";

export default function AppSidebar(props: ComponentProps<typeof Sidebar>) {
	const user = useAuthStore((s) => s.user);
	const params = useParams();
	const lang = params.lang;
	const slug = params.slug

	const data = {
		navMain: [
			{
				title: "Dashboard",
				url: `/${lang}/admin/${slug}/dashboard`,
				icon: CheckerboardIcon,
			},
			{
				title: "Revendas",
				url: `/${lang}/admin/${slug}/revendas`,
				icon: FolderUserIcon,
			},
			{
				title: "Administradores",
				url: `/${lang}/admin/${slug}/admins`,
				icon: IdentificationBadgeIcon,
			},
		],
	};

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader className="bg-background shadow-sm rounded h-16 flex items-center justify-between flex-row px-4">
				<Link
					href="/"
					className="text-primary hover:text-primary/90 flex items-center justify-center gap-2"
				>
					<Logo />
					<span className="text-base font-semibold">Hook Asaas</span>
				</Link>
			</SidebarHeader>
			<SidebarContent className="mt-2 bg-background rounded">
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter className="bg-background rounded">
				<SignOutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
