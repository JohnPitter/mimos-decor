import { create } from "zustand";
import { api } from "../lib/api.js";
import type { Product } from "@mimos/shared";

interface ProductState {
  products: Product[];
  total: number;
  loading: boolean;
  fetchProducts: (params?: { search?: string; page?: number }) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  total: 0,
  loading: false,
  fetchProducts: async (params) => {
    set({ loading: true });
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      qs.set("page", String(params?.page ?? 1));
      qs.set("limit", "20");
      const data = await api.get<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>(`/products?${qs}`);
      set({ products: data.products, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createProduct: async (data) => {
    return api.post<Product>("/products", data);
  },
  updateProduct: async (id, data) => {
    await api.put(`/products/${id}`, data);
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
  },
}));
