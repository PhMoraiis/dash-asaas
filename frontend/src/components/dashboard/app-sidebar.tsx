"use client";

import {
	CheckerboardIcon,
	IdentificationBadgeIcon,
	UserIcon,
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
	const slug = params.slug;

	const data = {
		navMain:
			user?.role === "admin"
				? [
						{
							title: "Administradores",
							url: `/${lang}/admin/${slug}/admins`,
							icon: IdentificationBadgeIcon,
						},
						{
							title: "Revendas",
							url: `/${lang}/admin/${slug}/revendas`,
							icon: UserIcon,
						},
					]
				: [
						{
							title: "Dashboard",
							url: `/${lang}/revenda/${slug}/dashboard`,
							icon: CheckerboardIcon,
						},
						{
							title: "Produtos",
							url: `/${lang}/revenda/${slug}/produtos`,
							icon: UserIcon,
						},
						{
							title: "Webhooks",
							url: `/${lang}/revenda/${slug}/webhooks`,
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
