"use client";

import type * as React from "react";
import { IconDashboard, IconFolder } from "@tabler/icons-react";
import { NavMain } from "@/components/dashboard/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import Logo from "../navbar/logo";
import Link from "next/link";
import { SignOutButton } from "./signOutButton";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "#",
			icon: IconDashboard,
		},
		{
			title: "Revendas",
			url: "/dashboard/revendas",
			icon: IconFolder,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
