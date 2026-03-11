import { describe, it, expect } from "vitest";
import { calcProductCost, calcIdealPrice, calcFromPrice } from "./engine.js";
import { MARKETPLACES } from "./marketplaces.js";

const sampleCosts = {
  productCost: 50,
  packaging: 3,
  labor: 2,
  shipping: 10,
  otherCosts: 5,
  taxRate: 6,
};

describe("calcProductCost", () => {
  it("calculates subtotal, tax, and total", () => {
    const result = calcProductCost(sampleCosts);
    expect(result.subtotal).toBe(70);
    expect(result.tax).toBeCloseTo(4.2);
    expect(result.total).toBeCloseTo(74.2);
  });
});

describe("calcIdealPrice", () => {
  it("converges for Shopee CNPJ with 20% margin", () => {
    const result = calcIdealPrice(sampleCosts, 20, MARKETPLACES.SHOPEE_CNPJ);
    expect(result.salePrice).toBeGreaterThan(0);
    expect(result.actualMargin).toBeCloseTo(20, 0);
  });

  it("converges for ML Classico with 30% margin", () => {
    const result = calcIdealPrice(sampleCosts, 30, MARKETPLACES.ML_CLASSICO);
    expect(result.salePrice).toBeGreaterThan(0);
    expect(result.actualMargin).toBeCloseTo(30, 0);
  });
});

describe("calcFromPrice", () => {
  it("calculates profit for R$140 Shopee CNPJ", () => {
    const costs = { ...sampleCosts, shipping: 10.61, otherCosts: 5 };
    const result = calcFromPrice(140, costs, MARKETPLACES.SHOPEE_CNPJ);
    expect(result.fees.totalFees).toBeCloseTo(39.6, 1);
    expect(result.netRevenue).toBeCloseTo(100.4, 1);
  });

  it("Shopee CPF costs R$3 more than CNPJ", () => {
    const cnpj = calcFromPrice(140, sampleCosts, MARKETPLACES.SHOPEE_CNPJ);
    const cpf = calcFromPrice(140, sampleCosts, MARKETPLACES.SHOPEE_CPF);
    expect(cpf.fees.totalFees - cnpj.fees.totalFees).toBeCloseTo(3);
  });
});
