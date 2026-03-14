import type { GatewayId } from "./product.js";

export type DeliveryStatus =
  | "PENDING"
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "Pendente",
  PREPARING: "Preparando",
  IN_TRANSIT: "Em Trânsito",
  DELIVERED: "Entregue",
  RETURNED: "Devolvido",
  CANCELLED: "Cancelado",
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: "yellow",
  PREPARING: "blue",
  IN_TRANSIT: "indigo",
  DELIVERED: "green",
  RETURNED: "orange",
  CANCELLED: "red",
};

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  salePrice: number;
  unitCost: number;
  totalFees: number;
  profit: number;
}

export interface Sale {
  id: string;
  gateway: GatewayId;
  salePrice: number;
  totalCost: number;
  totalFees: number;
  netRevenue: number;
  profit: number;
  discount: number;
  saleDate: string;
  customerName: string | null;
  customerDocument: string | null;
  customerState: string | null;
  deliveryStatus: DeliveryStatus;
  trackingCode: string | null;
  importedFrom: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  gateway: GatewayId;
  items: CreateSaleItemInput[];
  customerName?: string;
  customerDocument?: string;
  customerState?: string;
  trackingCode?: string;
  deliveryStatus?: DeliveryStatus;
  discount?: number;
  saleDate?: string;
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

export interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  supplier: string | null;
}

export interface ProductStockItem {
  name: string;
  quantity: number;
  imageUrl: string | null;
}

export interface SaleDashboard {
  totalSalesToday: number;
  totalSalesMonth: number;
  revenueMonth: number;
  profitMonth: number;
  averageTicket: number;
  salesByGateway: { gateway: GatewayId; count: number; revenue: number }[];
  salesByDay: { date: string; count: number; revenue: number }[];
  topProducts: { productName: string; productImageUrl: string | null; count: number; revenue: number }[];
  lowStockProducts: LowStockProduct[];
  productStock: ProductStockItem[];
}
