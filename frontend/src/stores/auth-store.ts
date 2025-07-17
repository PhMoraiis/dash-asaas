import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "revenda";
	slug: string;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	login: (user: User) => void;
	logout: () => void;
	setUser: (user: User | null) => void;
	checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, _get) => ({
			user: null,
			isAuthenticated: false,
			loading: false,
			login: (user) => set({ user, isAuthenticated: true, loading: false }),
			logout: async () => {
				try {
					await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
						method: "POST",
						credentials: "include",
					});
				} catch (_e) {
					// Tratar erros aqui, se necessário
				}
				set({ user: null, isAuthenticated: false, loading: false });
			},
			setUser: (user) => set({ user, isAuthenticated: !!user }),
			checkAuth: async () => {
				set({ loading: true });
				try {
					const res = await fetchWithAuth(
						`${process.env.NEXT_PUBLIC_API_URL}/api/me`,
					);
					if (!res.ok) throw new Error("Not authenticated");
					const user = await res.json();
					set({ user, isAuthenticated: true, loading: false });
				} catch {
					set({ user: null, isAuthenticated: false, loading: false });
				}
			},
		}),
		{
			name: "auth-storage",
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
