"use client";

import type { Icon } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
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
		icon?: Icon;
	}[];
}) {
	const router = useRouter();

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
							variant="ghost"
							className="w-full justify-start px-0 cursor-pointer"
							key={item.title}
							onClick={() => {
								router.push(item.url);
							}}
						>
							<div className="flex items-center gap-2">
								<div className="size-9 bg-border rounded-lg flex items-center justify-center">
									{item.icon && <item.icon size={20} />}
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
