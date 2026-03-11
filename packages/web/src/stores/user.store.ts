import { create } from "zustand";
import { api } from "../lib/api.js";
import type { User, CreateUserInput, UpdateUserInput } from "@mimos/shared";

interface UserState {
  users: User[];
  total: number;
  loading: boolean;
  fetchUsers: (page?: number) => Promise<void>;
  createUser: (data: CreateUserInput) => Promise<void>;
  updateUser: (id: string, data: UpdateUserInput) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  total: 0,
  loading: false,

  fetchUsers: async (page = 1) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await api.get<{ users: User[]; total: number }>(`/users?page=${page}&limit=20`);
      set({ users: data.users, total: data.total });
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (data) => {
    await api.post("/users", data);
    await get().fetchUsers();
  },

  updateUser: async (id, data) => {
    await api.put(`/users/${id}`, data);
    await get().fetchUsers();
  },

  deleteUser: async (id) => {
    await api.delete(`/users/${id}`);
    await get().fetchUsers();
  },
}));
