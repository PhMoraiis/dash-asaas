import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function DashboardPage() {
	const { user, isAuthenticated, loading, checkAuth, logout } = useAuthStore();
	const router = useRouter();
	const [error, setError] = useState("");
	const [privateData, setPrivateData] = useState<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated && !loading) {
			checkAuth().then(() => {
				if (!useAuthStore.getState().isAuthenticated) {
					router.replace("/login");
				}
			});
		}
	}, [isAuthenticated, loading, checkAuth, router]);

	useEffect(() => {
		async function fetchProtected() {
			try {
				const res = await fetchWithAuth("/api/private-test");
				if (!res.ok) throw new Error("Erro ao buscar dados protegidos");
				const data = await res.json();
				setPrivateData(data.message);
			} catch (err: unknown) {
				if (err instanceof Error) {
					setError(err.message || "Sessão expirada. Faça login novamente.");
				} else {
					setError("Sessão expirada. Faça login novamente.");
				}
			}
		}
		if (isAuthenticated) fetchProtected();
	}, [isAuthenticated]);

	if (!isAuthenticated) return <div>Carregando...</div>;

	function handleLogout() {
		logout();
		router.replace("/login");
	}

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
			<p>
				Bem-vindo, {user?.name} ({user?.role})
			</p>
			{privateData && <p className="mt-4 text-green-700">{privateData}</p>}
			{error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
			<button
				onClick={handleLogout}
				type="button"
				className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
			>
				Logout
			</button>
		</div>
	);
}
