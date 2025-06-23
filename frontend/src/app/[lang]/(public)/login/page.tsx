import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const login = useAuthStore((s) => s.login);
	const setUser = useAuthStore((s) => s.setUser);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		try {
			const res = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
				credentials: "include",
			});
			if (!res.ok) throw new Error("Login inválido");
			const user = await res.json();
			login(user);
			setUser(user);
			router.push("/dashboard");
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			setError(err.message || "Erro ao logar");
		}
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4 w-80 p-8 border rounded bg-white shadow"
			>
				<h1 className="text-xl font-bold mb-2">Login</h1>
				<input
					type="email"
					placeholder="E-mail"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="border p-2 rounded"
					required
				/>
				<input
					type="password"
					placeholder="Senha"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="border p-2 rounded"
					required
				/>
				{error && <div className="text-red-500 text-sm">{error}</div>}
				<button
					type="submit"
					className="bg-black text-white rounded p-2 font-semibold"
				>
					Entrar
				</button>
			</form>
		</div>
	);
}
