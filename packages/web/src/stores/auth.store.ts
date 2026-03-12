import { create } from "zustand";
import { api } from "../lib/api.js";
import { useSettingsStore } from "./settings.store.js";
import type { User } from "@mimos/shared";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const data = await api.post<{ user: User }>("/auth/login", { email, password });
    set({ user: data.user });
    useSettingsStore.getState().loadFromUser(data.user);
  },
  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, loading: false });
      useSettingsStore.getState().loadFromUser(data.user);
    } catch {
      set({ user: null, loading: false });
    }
  },
  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.permissions.includes(permission);
  },
}));
