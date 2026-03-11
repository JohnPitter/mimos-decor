import type { GatewayId } from "./product.js";

export type DeliveryStatus =
  | "PENDING"
  | "PREPARING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "Pendente",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  IN_TRANSIT: "Em Trânsito",
  DELIVERED: "Entregue",
  RETURNED: "Devolvido",
  CANCELLED: "Cancelado",
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: "yellow",
  PREPARING: "blue",
  SHIPPED: "indigo",
  IN_TRANSIT: "purple",
  DELIVERED: "green",
  RETURNED: "orange",
  CANCELLED: "red",
};

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  gateway: GatewayId;
  salePrice: number;
  unitCost: number;
  totalFees: number;
  netRevenue: number;
  profit: number;
  customerName: string | null;
  customerDocument: string | null;
  deliveryStatus: DeliveryStatus;
  trackingCode: string | null;
  importedFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  productId: string;
  quantity: number;
  gateway: GatewayId;
  salePrice: number;
  customerName?: string;
  customerDocument?: string;
  trackingCode?: string;
}

export interface UpdateSaleInput {
  deliveryStatus?: DeliveryStatus;
  trackingCode?: string;
  customerName?: string;
  customerDocument?: string;
}

export interface DeliveryStatusHistoryEntry {
  id: string;
  saleId: string;
  fromStatus: DeliveryStatus;
  toStatus: DeliveryStatus;
  changedByName: string;
  changedAt: string;
}

export interface SaleDashboard {
  totalSalesToday: number;
  totalSalesMonth: number;
  revenueMonth: number;
  profitMonth: number;
  averageTicket: number;
  salesByGateway: { gateway: GatewayId; count: number; revenue: number }[];
  salesByDay: { date: string; count: number; revenue: number }[];
  topProducts: { productName: string; count: number; revenue: number }[];
}
