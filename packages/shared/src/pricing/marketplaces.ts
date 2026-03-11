export interface FeeResult {
  commission: number;
  fixedFee: number;
  totalFees: number;
  pixDiscount: number;
  totalFeesWithPix: number;
  commissionPct: number;
}

interface Tier {
  maxPrice: number;
  pct: number;
  fixed: number;
}

interface PixTier {
  maxPrice: number;
  pct: number;
}

// ── Shopee CNPJ (Mar 2026) ──
const SHOPEE_CNPJ_TIERS: Tier[] = [
  { maxPrice: 79.99, pct: 0.20, fixed: 4 },
  { maxPrice: 99.99, pct: 0.14, fixed: 16 },
  { maxPrice: 199.99, pct: 0.14, fixed: 20 },
  { maxPrice: 499.99, pct: 0.14, fixed: 26 },
  { maxPrice: Infinity, pct: 0.14, fixed: 28 },
];

const SHOPEE_PIX_SUBSIDY: PixTier[] = [
  { maxPrice: 79.99, pct: 0 },
  { maxPrice: 99.99, pct: 0.05 },
  { maxPrice: 199.99, pct: 0.05 },
  { maxPrice: 499.99, pct: 0.05 },
  { maxPrice: Infinity, pct: 0.08 },
];

function getTier<T extends { maxPrice: number }>(price: number, tiers: T[]): T {
  return tiers.find((t) => price <= t.maxPrice) ?? tiers[tiers.length - 1];
}

function calcShopeeCNPJ(salePrice: number): FeeResult {
  const tier = getTier(salePrice, SHOPEE_CNPJ_TIERS);
  const commission = salePrice * tier.pct;
  const fixedFee = tier.fixed;
  const totalFees = commission + fixedFee;
  const pixTier = getTier(salePrice, SHOPEE_PIX_SUBSIDY);
  const pixDiscount = salePrice * pixTier.pct;
  return {
    commission,
    fixedFee,
    totalFees,
    pixDiscount,
    totalFeesWithPix: totalFees - pixDiscount,
    commissionPct: tier.pct,
  };
}

// ── Shopee CPF (+R$3 surcharge) ──
function calcShopeeCPF(salePrice: number): FeeResult {
  const base = calcShopeeCNPJ(salePrice);
  const cpfExtra = 3;
  const fixedFee = base.fixedFee + cpfExtra;
  const totalFees = base.commission + fixedFee;
  return {
    ...base,
    fixedFee,
    totalFees,
    totalFeesWithPix: totalFees - base.pixDiscount,
  };
}

// ── Mercado Livre Clássico ──
const ML_CLASSICO_TIERS: Tier[] = [
  { maxPrice: 79, pct: 0.14, fixed: 6.5 },
  { maxPrice: 199, pct: 0.13, fixed: 0 },
  { maxPrice: Infinity, pct: 0.10, fixed: 0 },
];

function calcMLClassico(salePrice: number): FeeResult {
  const tier = getTier(salePrice, ML_CLASSICO_TIERS);
  const commission = salePrice * tier.pct;
  const fixedFee = tier.fixed;
  const totalFees = commission + fixedFee;
  return {
    commission,
    fixedFee,
    totalFees,
    pixDiscount: 0,
    totalFeesWithPix: totalFees,
    commissionPct: tier.pct,
  };
}

// ── Mercado Livre Premium ──
const ML_PREMIUM_TIERS: Tier[] = [
  { maxPrice: 79, pct: 0.19, fixed: 0 },
  { maxPrice: 199, pct: 0.18, fixed: 0 },
  { maxPrice: Infinity, pct: 0.15, fixed: 0 },
];

function calcMLPremium(salePrice: number): FeeResult {
  const tier = getTier(salePrice, ML_PREMIUM_TIERS);
  const commission = salePrice * tier.pct;
  return {
    commission,
    fixedFee: 0,
    totalFees: commission,
    pixDiscount: 0,
    totalFeesWithPix: commission,
    commissionPct: tier.pct,
  };
}

export interface Marketplace {
  id: string;
  name: string;
  badge: string;
  calculate: (salePrice: number) => FeeResult;
  hasPix: boolean;
}

export const MARKETPLACES: Record<string, Marketplace> = {
  SHOPEE_CNPJ: { id: "SHOPEE_CNPJ", name: "Shopee", badge: "CNPJ", calculate: calcShopeeCNPJ, hasPix: true },
  SHOPEE_CPF: { id: "SHOPEE_CPF", name: "Shopee", badge: "CPF", calculate: calcShopeeCPF, hasPix: true },
  ML_CLASSICO: { id: "ML_CLASSICO", name: "Mercado Livre", badge: "Clássico", calculate: calcMLClassico, hasPix: false },
  ML_PREMIUM: { id: "ML_PREMIUM", name: "Mercado Livre", badge: "Premium", calculate: calcMLPremium, hasPix: false },
};
