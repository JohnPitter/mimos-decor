import type { Marketplace, FeeResult } from "./marketplaces.js";

export interface ProductCosts {
  productCost: number;
  packaging: number;
  labor: number;
  shipping: number;
  otherCosts: number;
  taxRate: number;
}

export interface CostBreakdown {
  subtotal: number;
  tax: number;
  total: number;
}

export interface PricingResult {
  salePrice: number;
  totalCost: number;
  fees: FeeResult;
  netRevenue: number;
  profit: number;
  actualMargin: number;
}

export function calcProductCost(costs: ProductCosts): CostBreakdown {
  const subtotal = costs.productCost + costs.packaging + costs.labor + costs.shipping + costs.otherCosts;
  const tax = subtotal * (costs.taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export function calcIdealPrice(costs: ProductCosts, marginPct: number, marketplace: Marketplace): PricingResult {
  const { total: totalCost } = calcProductCost(costs);
  const margin = marginPct / 100;

  let price = totalCost / (1 - margin - 0.14);
  for (let i = 0; i < 20; i++) {
    const fees = marketplace.calculate(price);
    const neededPrice = (totalCost + fees.fixedFee) / (1 - margin - fees.commissionPct);
    if (Math.abs(neededPrice - price) < 0.01) break;
    price = neededPrice;
  }

  const fees = marketplace.calculate(price);
  const netRevenue = price - fees.totalFees;
  const profit = netRevenue - totalCost;
  const actualMargin = price > 0 ? (profit / price) * 100 : 0;

  return {
    salePrice: Math.ceil(price * 100) / 100,
    totalCost,
    fees,
    netRevenue,
    profit,
    actualMargin,
  };
}

export function calcFromPrice(salePrice: number, costs: ProductCosts, marketplace: Marketplace): PricingResult {
  const { total: totalCost } = calcProductCost(costs);
  const fees = marketplace.calculate(salePrice);
  const netRevenue = salePrice - fees.totalFees;
  const profit = netRevenue - totalCost;
  const actualMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  return { salePrice, totalCost, fees, netRevenue, profit, actualMargin };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
