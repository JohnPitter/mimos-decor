import { create } from "zustand";
import { api } from "../lib/api.js";
import type { AuditLog, AuditAction, AuditEntity } from "@mimos/shared";

interface AuditState {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  fetchLogs: (filters?: {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    startDate?: string;
    endDate?: string;
    page?: number;
  }) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  total: 0,
  loading: false,

  fetchLogs: async (filters = {}) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.action) params.set("action", filters.action);
      if (filters.entity) params.set("entity", filters.entity);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      params.set("page", String(filters.page ?? 1));
      params.set("limit", "20");

      const data = await api.get<{ logs: AuditLog[]; total: number }>(`/audit-logs?${params.toString()}`);
      set({ logs: data.logs, total: data.total });
    } finally {
      set({ loading: false });
    }
  },
}));
