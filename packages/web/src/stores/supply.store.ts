import { create } from "zustand";
import { api } from "../lib/api.js";
import type { Supply, CreateSupplyPurchaseInput } from "@mimos/shared";

interface SupplyState {
  supplies: Supply[];
  total: number;
  loading: boolean;
  fetchSupplies: (params?: { search?: string; page?: number }) => Promise<void>;
  createSupply: (data: Record<string, unknown>) => Promise<void>;
  updateSupply: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  registerPurchase: (supplyId: string, data: CreateSupplyPurchaseInput) => Promise<void>;
}

export const useSupplyStore = create<SupplyState>((set) => ({
  supplies: [],
  total: 0,
  loading: false,
  fetchSupplies: async (params) => {
    set({ loading: true });
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      qs.set("page", String(params?.page ?? 1));
      qs.set("limit", "20");
      const data = await api.get<{ supplies: Supply[]; total: number }>(`/supplies?${qs}`);
      set({ supplies: data.supplies, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createSupply: async (data) => {
    await api.post("/supplies", data);
  },
  updateSupply: async (id, data) => {
    await api.put(`/supplies/${id}`, data);
  },
  deleteSupply: async (id) => {
    await api.delete(`/supplies/${id}`);
  },
  registerPurchase: async (supplyId, data) => {
    await api.post(`/supplies/${supplyId}/purchase`, data);
  },
}));
