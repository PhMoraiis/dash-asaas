import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminRevendasPage() {
	const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated && !loading) {
			checkAuth().then(() => {
				const { isAuthenticated, user } = useAuthStore.getState();
				if (!isAuthenticated) {
					router.replace("/login");
				} else if (user?.role !== "admin") {
					router.replace("/dashboard");
				}
			});
		} else if (isAuthenticated && user?.role !== "admin") {
			router.replace("/dashboard");
		}
	}, [isAuthenticated, loading, user, checkAuth, router]);

	if (!isAuthenticated || user?.role !== "admin")
		return <div>Carregando...</div>;

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Admin - Revendas</h1>
			<p>Área restrita para administradores.</p>
		</div>
	);
}
