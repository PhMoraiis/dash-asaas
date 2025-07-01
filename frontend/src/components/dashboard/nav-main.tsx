"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		icon?: React.ComponentType<any>;
	}[];
}) {
	const router = useRouter();
	const pathname = usePathname();

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<Button
					className="justify-center items-center text-md cursor-pointer"
					onClick={() => {}}
				>
					<PlusIcon size={24} />
					<span>Cadastrar Revenda</span>
				</Button>
				<SidebarMenu className="flex space-y-2">
					{items.map((item) => (
						<Button
							variant={pathname === item.url ? "input" : "ghost"}
							className={`w-full justify-start px-0 cursor-pointer ${
								pathname === item.url
									? "font-bold bg-muted"
									: "text-gray-600 dark:text-gray-300"
							}`}
							key={item.title}
							onClick={() => {
								router.push(item.url);
							}}
						>
							<div className="flex items-center gap-2">
								<div className="size-9 bg-border rounded-lg flex items-center justify-center">
									{item.icon && <item.icon size={24} weight="bold" />}
								</div>
								<span>{item.title}</span>
							</div>
						</Button>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
