export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  supplier: string | null;
  shippingCost: number;
  desiredMargin: number;
  taxRate: number;
  packagingCost: number;
  laborCost: number;
  otherCosts: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  unitPrice: number;
  quantity: number;
  supplier?: string;
  shippingCost: number;
  desiredMargin: number;
  taxRate?: number;
  packagingCost?: number;
  laborCost?: number;
  otherCosts?: number;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export type BuiltInGatewayId = "SHOPEE_CNPJ" | "SHOPEE_CPF" | "ML_CLASSICO" | "ML_PREMIUM";

export type GatewayId = string;

export const BUILT_IN_GATEWAYS: BuiltInGatewayId[] = ["SHOPEE_CNPJ", "SHOPEE_CPF", "ML_CLASSICO", "ML_PREMIUM"];

export interface CustomGateway {
  id: string;
  slug: string;
  name: string;
  color: string;
  tiers: { maxPrice: number; pct: number; fixed: number }[];
  pixTiers: { maxPrice: number; pct: number }[];
  extraFixed: number;
  createdAt: string;
}

export interface CreateCustomGatewayInput {
  slug: string;
  name: string;
  color?: string;
  tiers: { maxPrice: number; pct: number; fixed: number }[];
  pixTiers?: { maxPrice: number; pct: number }[];
  extraFixed?: number;
}

export interface UpdateCustomGatewayInput {
  name?: string;
  color?: string;
  tiers?: { maxPrice: number; pct: number; fixed: number }[];
  pixTiers?: { maxPrice: number; pct: number }[];
  extraFixed?: number;
}

export interface ProductWithPricing extends Product {
  prices: Record<GatewayId, {
    salePrice: number;
    profit: number;
    margin: number;
  }>;
}
