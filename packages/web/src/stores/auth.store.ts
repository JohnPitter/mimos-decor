import { create } from "zustand";
import { api } from "../lib/api.js";
import type { User } from "@mimos/shared";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const data = await api.post<{ user: User }>("/auth/login", { email, password });
    set({ user: data.user });
  },
  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
