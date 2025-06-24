"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminPage() {
	const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
	const params = useParams();
	const adminId =
		typeof params?.adminId === "string"
			? params.adminId
			: Array.isArray(params?.adminId)
				? params.adminId[0]
				: "";

	useEffect(() => {
		if (!isAuthenticated && !loading) {
			checkAuth();
		}
	}, [isAuthenticated, loading, checkAuth]);

	if (!isAuthenticated || user?.role !== "admin" || user?.id !== adminId)
		return <div>Carregando...</div>;

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Admin {user.name}</h1>
			<p>Área restrita para administradores.</p>
		</div>
	);
}
