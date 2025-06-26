"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div>
			<Toggle
				variant="outline"
				className="group data-[state=on]:hover:bg-muted text-muted-foreground data-[state=on]:text-muted-foreground data-[state=on]:hover:text-foreground size-8 rounded-full border-none shadow-none data-[state=on]:bg-transparent cursor-pointer"
				pressed={theme === "dark"}
				onPressedChange={() =>
					setTheme((prev) => (prev === "dark" ? "light" : "dark"))
				}
				aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
			>
				<MoonIcon
					size={16}
					className="shrink-0 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100"
					aria-hidden="true"
				/>
				<SunIcon
					size={16}
					className="absolute shrink-0 scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0"
					aria-hidden="true"
				/>
			</Toggle>
		</div>
	);
}
