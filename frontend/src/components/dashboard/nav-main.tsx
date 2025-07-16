"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useState } from "react";
import { CreateRevendaModal } from "../../app/[lang]/(private)/admin/[slug]/revendas/_components/create-revenda-modal";
import { CreateAdminModal } from "../../app/[lang]/(private)/admin/[slug]/admins/_components/create-admin-modal";
import { CreateProductModal } from "../../app/[lang]/(private)/revenda/[slug]/produtos/_components/create-product-modal";
import { useAuthStore } from "@/stores/auth-store";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		// biome-ignore lint/suspicious/noExplicitAny: ignore
		icon?: React.ComponentType<any>;
	}[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [openRevenda, setOpenRevenda] = useState(false);
	const [openAdmin, setOpenAdmin] = useState(false);
	const [openProduct, setOpenProduct] = useState(false);
	const user = useAuthStore((s) => s.user);

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="justify-center items-center text-md cursor-pointer">
							<span>Menu de Cadastros</span>
							<CaretDownIcon size={24} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{user?.role === "admin" ? (
							<>
								<DropdownMenuItem onSelect={() => setOpenRevenda(true)}>
									Cadastrar Revenda
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setOpenAdmin(true)}>
									Cadastrar Administrador
								</DropdownMenuItem>
							</>
						) : (
							<DropdownMenuItem
								onSelect={() => {
									setOpenProduct(true);
								}}
							>
								Cadastrar Produto
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
				<CreateRevendaModal open={openRevenda} onOpenChange={setOpenRevenda} />
				<CreateAdminModal open={openAdmin} onOpenChange={setOpenAdmin} />
				<CreateProductModal open={openProduct} onOpenChange={setOpenProduct} />
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
