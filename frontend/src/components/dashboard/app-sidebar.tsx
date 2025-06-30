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
import { SignOutButton } from "./signOutButton";

export default function AppSidebar({ params, ...props }) {
	const lang = params.lang;
	const userId = params.id;

	const data = {
		navMain: [
			{
				title: "Dashboard",
				url: `/${lang}/admin/${userId}/dashboard`,
				icon: CheckerboardIcon,
			},
			{
				title: "Revendas",
				url: "/dashboard/revendas",
				icon: FolderUserIcon,
			},
			{
				title: "Administradores",
				url: "/dashboard/admins",
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
