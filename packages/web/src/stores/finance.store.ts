import { create } from "zustand";
import { api } from "../lib/api.js";
import type { FinanceEntry, FinanceCategory, FinanceSummary, FinanceNotifications } from "@mimos/shared";

interface FinanceState {
  entries: FinanceEntry[];
  total: number;
  loading: boolean;
  summary: FinanceSummary | null;
  notifications: FinanceNotifications | null;
  categories: FinanceCategory[];
  fetchEntries: (params?: {
    search?: string;
    type?: string;
    status?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
  }) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchNotifications: () => Promise<FinanceNotifications | null>;
  fetchCategories: () => Promise<void>;
  createEntry: (data: Record<string, unknown>) => Promise<void>;
  updateEntry: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  deleteRecurringGroup: (groupId: string) => Promise<void>;
  payEntry: (id: string) => Promise<void>;
  createCategory: (data: Record<string, unknown>) => Promise<void>;
  updateCategory: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  entries: [],
  total: 0,
  loading: false,
  summary: null,
  notifications: null,
  categories: [],
  fetchEntries: async (params) => {
    set({ loading: true });
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.type) qs.set("type", params.type);
      if (params?.status) qs.set("status", params.status);
      if (params?.categoryId) qs.set("categoryId", params.categoryId);
      if (params?.startDate) qs.set("startDate", params.startDate);
      if (params?.endDate) qs.set("endDate", params.endDate);
      qs.set("page", String(params?.page ?? 1));
      qs.set("limit", "20");
      const data = await api.get<{ entries: FinanceEntry[]; total: number }>(`/finances?${qs}`);
      set({ entries: data.entries, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchSummary: async () => {
    try {
      const summary = await api.get<FinanceSummary>("/finances/summary");
      set({ summary });
    } catch { /* ignore */ }
  },
  fetchNotifications: async () => {
    try {
      const notifications = await api.get<FinanceNotifications>("/finances/notifications");
      set({ notifications });
      return notifications;
    } catch {
      return null;
    }
  },
  fetchCategories: async () => {
    try {
      const categories = await api.get<FinanceCategory[]>("/finance-categories");
      set({ categories });
    } catch { /* ignore */ }
  },
  createEntry: async (data) => {
    await api.post("/finances", data);
  },
  updateEntry: async (id, data) => {
    await api.put(`/finances/${id}`, data);
  },
  deleteEntry: async (id) => {
    await api.delete(`/finances/${id}`);
  },
  deleteRecurringGroup: async (groupId) => {
    await api.delete(`/finances/group/${groupId}`);
  },
  payEntry: async (id) => {
    await api.patch(`/finances/${id}/pay`);
  },
  createCategory: async (data) => {
    await api.post("/finance-categories", data);
  },
  updateCategory: async (id, data) => {
    await api.put(`/finance-categories/${id}`, data);
  },
  deleteCategory: async (id) => {
    await api.delete(`/finance-categories/${id}`);
  },
}));
