import { create } from "zustand";
import { api } from "../lib/api.js";
import type { Sale, DeliveryStatus, GatewayId, DeliveryStatusHistoryEntry } from "@mimos/shared";

interface SaleWithHistory extends Sale {
  statusHistory?: DeliveryStatusHistoryEntry[];
}

interface SaleListResponse {
  sales: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ImportResult {
  success: number;
  errors: string[];
}

interface SaleState {
  sales: Sale[];
  total: number;
  loading: boolean;
  fetchSales: (params?: {
    status?: DeliveryStatus;
    gateway?: GatewayId;
    startDate?: string;
    endDate?: string;
    page?: number;
  }) => Promise<void>;
  createSale: (data: {
    productId: string;
    quantity: number;
    gateway: GatewayId;
    salePrice: number;
    customerName?: string;
    customerDocument?: string;
  }) => Promise<void>;
  updateSaleStatus: (id: string, status: DeliveryStatus) => Promise<void>;
  importCSV: (file: File, gateway: string) => Promise<ImportResult>;
  getSaleDetail: (id: string) => Promise<SaleWithHistory>;
}

export const useSaleStore = create<SaleState>((set) => ({
  sales: [],
  total: 0,
  loading: false,
  fetchSales: async (params) => {
    set({ loading: true });
    try {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.gateway) qs.set("gateway", params.gateway);
      if (params?.startDate) qs.set("startDate", params.startDate);
      if (params?.endDate) qs.set("endDate", params.endDate);
      if (params?.page) qs.set("page", String(params.page));
      const data = await api.get<SaleListResponse>(`/sales?${qs}`);
      set({ sales: data.sales, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createSale: async (data) => {
    await api.post("/sales", data);
  },
  updateSaleStatus: async (id, status) => {
    await api.patch(`/sales/${id}/status`, { status });
  },
  importCSV: async (file, gateway) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gateway", gateway);
    return api.upload<ImportResult>("/sales/import", formData);
  },
  getSaleDetail: async (id) => {
    return api.get<SaleWithHistory>(`/sales/${id}`);
  },
}));
