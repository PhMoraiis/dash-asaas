"use client";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import {
	CommandIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";

export function CommandBar() {
	const [open, setOpen] = useState(false);

	const handleOpenCommandBar = () => {
		setOpen((open) => !open);
	};

	const _handleCloseCommandBar = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleKeyDownEvent = (event: KeyboardEvent) => {
			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen((prevOpen) => !prevOpen);
			}
		};

		document.addEventListener("keydown", handleKeyDownEvent);

		return () => {
			document.removeEventListener("keydown", handleKeyDownEvent);
		};
	}, []);

	return (
		<div className="flex justify-between items-center w-full">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: ignore */}
			{/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
<div
				onClick={handleOpenCommandBar}
				className="bg-secondary hover:bg-border dark:bg-accent dark:text-popover-foreground dark:hover:bg-border hover:text-accent-foreground shadow-xs w-full justify-center items-center cursor-pointer transition-colors duration-300 ease-in h-10 rounded-md inline-flex gap-2 whitespace-nowrap"
			>
				<div className="flex items-center justify-between gap-24 px-2">
					<div className="flex items-center justify-center gap-2">
						<MagnifyingGlassIcon size={20} />
						<h2>Busque aqui...</h2>
					</div>
					<span className="flex items-center justify-center bg-primary text-primary-foreground px-1 py-0.5 rounded-lg">
						<CommandIcon />K
					</span>
				</div>
			</div>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Digite o que busca..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Revendas">
						<CommandItem>Calendar</CommandItem>
						<CommandItem>Search Emoji</CommandItem>
						<CommandItem>Calculator</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Produtos">
						<CommandItem>Profile</CommandItem>
						<CommandItem>Billing</CommandItem>
						<CommandItem>Settings</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</div>
	);
}
