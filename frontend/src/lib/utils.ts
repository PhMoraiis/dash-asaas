import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getFirstName(fullName?: string) {
	if (!fullName) return "";
	return fullName.split(" ")[0];
}

const STOPWORDS = ["de", "da", "do", "dos", "das", "e"];

export function getInitials(fullName?: string) {
	if (!fullName) return "";
	const names = fullName
		.trim()
		.split(" ")
		.filter(Boolean)
		.filter((word) => !STOPWORDS.includes(word.toLowerCase()));
	const first = names[0]?.charAt(0) ?? "";
	const second = names[1]?.charAt(0) ?? "";
	return (first + second).toUpperCase();
}
