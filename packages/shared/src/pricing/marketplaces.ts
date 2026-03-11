export interface FeeResult {
  commission: number;
  fixedFee: number;
  totalFees: number;
  pixDiscount: number;
  totalFeesWithPix: number;
  commissionPct: number;
}

export interface CommissionTier {
  maxPrice: number;
  pct: number;
  fixed: number;
}

export interface PixTier {
  maxPrice: number;
  pct: number;
}

export interface GatewayParams {
  tiers: CommissionTier[];
  pixTiers: PixTier[];
  extraFixed: number;
}

function getTier<T extends { maxPrice: number }>(price: number, tiers: T[]): T {
  return tiers.find((t) => price <= t.maxPrice) ?? tiers[tiers.length - 1];
}

function calcFromParams(salePrice: number, params: GatewayParams): FeeResult {
  const tier = getTier(salePrice, params.tiers);
  const commission = salePrice * tier.pct;
  const fixedFee = tier.fixed + params.extraFixed;
  const totalFees = commission + fixedFee;

  let pixDiscount = 0;
  if (params.pixTiers.length > 0) {
    const pixTier = getTier(salePrice, params.pixTiers);
    pixDiscount = salePrice * pixTier.pct;
  }

  return {
    commission,
    fixedFee,
    totalFees,
    pixDiscount,
    totalFeesWithPix: totalFees - pixDiscount,
    commissionPct: tier.pct,
  };
}

// ── Built-in gateway params ──

export const BUILT_IN_PARAMS: Record<string, GatewayParams> = {
  SHOPEE_CNPJ: {
    tiers: [
      { maxPrice: 79.99, pct: 0.20, fixed: 4 },
      { maxPrice: 99.99, pct: 0.14, fixed: 16 },
      { maxPrice: 199.99, pct: 0.14, fixed: 20 },
      { maxPrice: 499.99, pct: 0.14, fixed: 26 },
      { maxPrice: Infinity, pct: 0.14, fixed: 28 },
    ],
    pixTiers: [
      { maxPrice: 79.99, pct: 0 },
      { maxPrice: 99.99, pct: 0.05 },
      { maxPrice: 199.99, pct: 0.05 },
      { maxPrice: 499.99, pct: 0.05 },
      { maxPrice: Infinity, pct: 0.08 },
    ],
    extraFixed: 0,
  },
  SHOPEE_CPF: {
    tiers: [
      { maxPrice: 79.99, pct: 0.20, fixed: 4 },
      { maxPrice: 99.99, pct: 0.14, fixed: 16 },
      { maxPrice: 199.99, pct: 0.14, fixed: 20 },
      { maxPrice: 499.99, pct: 0.14, fixed: 26 },
      { maxPrice: Infinity, pct: 0.14, fixed: 28 },
    ],
    pixTiers: [
      { maxPrice: 79.99, pct: 0 },
      { maxPrice: 99.99, pct: 0.05 },
      { maxPrice: 199.99, pct: 0.05 },
      { maxPrice: 499.99, pct: 0.05 },
      { maxPrice: Infinity, pct: 0.08 },
    ],
    extraFixed: 3,
  },
  ML_CLASSICO: {
    tiers: [
      { maxPrice: 79, pct: 0.14, fixed: 6.5 },
      { maxPrice: 199, pct: 0.13, fixed: 0 },
      { maxPrice: Infinity, pct: 0.10, fixed: 0 },
    ],
    pixTiers: [],
    extraFixed: 0,
  },
  ML_PREMIUM: {
    tiers: [
      { maxPrice: 79, pct: 0.19, fixed: 0 },
      { maxPrice: 199, pct: 0.18, fixed: 0 },
      { maxPrice: Infinity, pct: 0.15, fixed: 0 },
    ],
    pixTiers: [],
    extraFixed: 0,
  },
};

export function buildMarketplace(id: string, name: string, params: GatewayParams): Marketplace {
  return {
    id,
    name,
    badge: "",
    calculate: (salePrice: number) => calcFromParams(salePrice, params),
    hasPix: params.pixTiers.length > 0,
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
  SHOPEE_CNPJ: { id: "SHOPEE_CNPJ", name: "Shopee", badge: "CNPJ", calculate: (p) => calcFromParams(p, BUILT_IN_PARAMS.SHOPEE_CNPJ), hasPix: true },
  SHOPEE_CPF: { id: "SHOPEE_CPF", name: "Shopee", badge: "CPF", calculate: (p) => calcFromParams(p, BUILT_IN_PARAMS.SHOPEE_CPF), hasPix: true },
  ML_CLASSICO: { id: "ML_CLASSICO", name: "Mercado Livre", badge: "Clássico", calculate: (p) => calcFromParams(p, BUILT_IN_PARAMS.ML_CLASSICO), hasPix: false },
  ML_PREMIUM: { id: "ML_PREMIUM", name: "Mercado Livre", badge: "Premium", calculate: (p) => calcFromParams(p, BUILT_IN_PARAMS.ML_PREMIUM), hasPix: false },
};
