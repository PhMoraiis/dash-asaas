import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "revenda";
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
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			loading: false,
			login: (user) => set({ user, isAuthenticated: true, loading: false }),
			logout: () => set({ user: null, isAuthenticated: false, loading: false }),
			setUser: (user) => set({ user, isAuthenticated: !!user }),
			checkAuth: async () => {
				set({ loading: true });
				try {
					const res = await fetch("/api/me", { credentials: "include" });
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
