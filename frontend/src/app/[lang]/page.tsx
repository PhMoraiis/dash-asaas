'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default async function Page() {
	const router = useRouter();

	const handleClick = () => {
		router.push("/login");
	};

	return (
		<main className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<Button onClick={handleClick}>Realizar Login</Button>
		</main>
	);
}
