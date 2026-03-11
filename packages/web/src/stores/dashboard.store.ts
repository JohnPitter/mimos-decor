import { create } from "zustand";
import { api } from "../lib/api.js";
import type { SaleDashboard } from "@mimos/shared";

interface DashboardState {
  data: SaleDashboard | null;
  loading: boolean;
  fetchDashboard: (startDate?: string, endDate?: string, topN?: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  fetchDashboard: async (startDate, endDate, topN) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (topN) params.set("topN", String(topN));
      const data = await api.get<SaleDashboard>(`/dashboard?${params}`);
      set({ data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
