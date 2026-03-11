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

export type GatewayId = "SHOPEE_CNPJ" | "SHOPEE_CPF" | "ML_CLASSICO" | "ML_PREMIUM";

export interface ProductWithPricing extends Product {
  prices: Record<GatewayId, {
    salePrice: number;
    profit: number;
    margin: number;
  }>;
}
