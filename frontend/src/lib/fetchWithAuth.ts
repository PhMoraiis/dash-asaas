import { useAuthStore } from "@/stores/auth-store";

export async function fetchWithAuth(
	input: RequestInfo,
	init?: RequestInit,
): Promise<Response> {
	let response = await fetch(input, { ...init, credentials: "include" });

	if (response.status === 401) {
		// Tenta renovar o token
		const refresh = await fetch("http://localhost:3333/api/refresh", {
			method: "POST",
			credentials: "include",
		});
		if (refresh.ok) {
			// Tenta novamente a requisição original
			response = await fetch(input, { ...init, credentials: "include" });
			if (response.status !== 401) return response;
		}
		// Se ainda assim falhar, faz logout
		useAuthStore.getState().logout();
		throw new Error("Sessão expirada. Faça login novamente.");
	}

	return response;
}
