# Mimos Decor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a store management system for Mimos Decor with product CRUD, marketplace pricing (Shopee/ML), sales tracking, user management, and audit logs.

**Architecture:** Monorepo with 3 packages — `@mimos/web` (React + Vite), `@mimos/api` (Express + Prisma + PostgreSQL), `@mimos/shared` (types + pricing engine). JWT auth with httpOnly cookies. Role-based access (Admin/Operator).

**Tech Stack:** React 18, Vite, Tailwind CSS 4, React Router 7, Zustand, Recharts, Lucide React, Express, Prisma, PostgreSQL, JWT, bcrypt, pnpm, Turborepo, Vitest.

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/api/src/index.ts`
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/index.html`
- Create: `packages/web/src/main.tsx`
- Create: `packages/web/src/App.tsx`

**Step 1: Create root monorepo config**

`package.json`:
```json
{
  "name": "mimos-decor",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

`.gitignore`:
```
node_modules
dist
.env
.env.local
*.log
.turbo
```

**Step 2: Create `@mimos/shared` package**

`packages/shared/package.json`:
```json
{
  "name": "@mimos/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Create `@mimos/api` package**

`packages/api/package.json`:
```json
{
  "name": "@mimos/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@mimos/shared": "workspace:*",
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.7",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "@prisma/client": "^6.4.0",
    "multer": "^1.4.5-lts.1",
    "csv-parse": "^5.6.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.7",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.12",
    "@types/morgan": "^1.9.9",
    "prisma": "^6.4.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0"
  }
}
```

`packages/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "prisma"]
}
```

**Step 4: Create `@mimos/web` package**

`packages/web/package.json`:
```json
{
  "name": "@mimos/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@mimos/shared": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.3.0",
    "zustand": "^5.0.0",
    "recharts": "^2.15.0",
    "lucide-react": "^0.474.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vite": "^6.2.0",
    "vitest": "^3.0.0"
  }
}
```

`packages/web/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

`packages/web/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mimos Decor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Install dependencies and verify**

```bash
cd mimos-decor && pnpm install && pnpm build
```

**Step 6: Commit**
```bash
git init && git add -A && git commit -m "feat: scaffold monorepo with shared, api, and web packages"
```

---

## Task 2: Shared Package — Types & Pricing Engine

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/product.ts`
- Create: `packages/shared/src/types/sale.ts`
- Create: `packages/shared/src/types/audit.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/pricing/marketplaces.ts`
- Create: `packages/shared/src/pricing/engine.ts`
- Create: `packages/shared/src/pricing/index.ts`
- Create: `packages/shared/src/pricing/engine.test.ts`
- Create: `packages/shared/src/index.ts`

**Step 1: Create types**

`packages/shared/src/types/user.ts`:
```ts
export type UserRole = "ADMIN" | "OPERATOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

`packages/shared/src/types/product.ts`:
```ts
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
```

`packages/shared/src/types/sale.ts`:
```ts
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
```

`packages/shared/src/types/audit.ts`:
```ts
export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntity = "PRODUCT" | "SALE" | "USER";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

`packages/shared/src/types/index.ts`:
```ts
export * from "./user.js";
export * from "./product.js";
export * from "./sale.js";
export * from "./audit.js";
```

**Step 2: Create constants**

`packages/shared/src/constants.ts`:
```ts
export const GATEWAY_LABELS: Record<string, string> = {
  SHOPEE_CNPJ: "Shopee CNPJ",
  SHOPEE_CPF: "Shopee CPF",
  ML_CLASSICO: "ML Clássico",
  ML_PREMIUM: "ML Premium",
};

export const GATEWAY_COLORS: Record<string, string> = {
  SHOPEE_CNPJ: "#EE4D2D",
  SHOPEE_CPF: "#EE4D2D",
  ML_CLASSICO: "#FFE600",
  ML_PREMIUM: "#FFE600",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  PRODUCTS: "/api/products",
  SALES: "/api/sales",
  SALES_IMPORT: "/api/sales/import",
  DASHBOARD: "/api/dashboard",
  USERS: "/api/users",
  AUDIT_LOGS: "/api/audit-logs",
} as const;
```

**Step 3: Port pricing engine from Precifique (convert JS → TS)**

`packages/shared/src/pricing/marketplaces.ts`:
```ts
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
```

`packages/shared/src/pricing/engine.ts`:
```ts
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
```

`packages/shared/src/pricing/index.ts`:
```ts
export * from "./marketplaces.js";
export * from "./engine.js";
```

`packages/shared/src/index.ts`:
```ts
export * from "./types/index.js";
export * from "./constants.js";
export * from "./pricing/index.js";
```

**Step 4: Write pricing tests**

`packages/shared/src/pricing/engine.test.ts`:
```ts
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
```

**Step 5: Run tests**
```bash
cd packages/shared && pnpm test
```

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: add shared types, constants, and pricing engine"
```

---

## Task 3: Database Schema (Prisma)

**Files:**
- Create: `packages/api/prisma/schema.prisma`
- Create: `packages/api/prisma/seed.ts`
- Create: `packages/api/.env`

**Step 1: Create Prisma schema**

`packages/api/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
}

enum Gateway {
  SHOPEE_CNPJ
  SHOPEE_CPF
  ML_CLASSICO
  ML_PREMIUM
}

enum DeliveryStatus {
  PENDING
  PREPARING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RETURNED
  CANCELLED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

enum AuditEntity {
  PRODUCT
  SALE
  USER
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      UserRole @default(OPERATOR)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  sales                Sale[]
  deliveryStatusChanges DeliveryStatusHistory[]
  auditLogs            AuditLog[]

  @@map("users")
}

model Product {
  id            String  @id @default(cuid())
  name          String
  unitPrice     Float   @map("unit_price")
  quantity      Int     @default(0)
  supplier      String?
  shippingCost  Float   @map("shipping_cost")
  desiredMargin Float   @default(20) @map("desired_margin")
  taxRate       Float   @default(0) @map("tax_rate")
  packagingCost Float   @default(0) @map("packaging_cost")
  laborCost     Float   @default(0) @map("labor_cost")
  otherCosts    Float   @default(0) @map("other_costs")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  sales Sale[]

  @@map("products")
}

model Sale {
  id               String         @id @default(cuid())
  productId        String         @map("product_id")
  quantity         Int
  gateway          Gateway
  salePrice        Float          @map("sale_price")
  unitCost         Float          @map("unit_cost")
  totalFees        Float          @map("total_fees")
  netRevenue       Float          @map("net_revenue")
  profit           Float
  customerName     String?        @map("customer_name")
  customerDocument String?        @map("customer_document")
  deliveryStatus   DeliveryStatus @default(PENDING) @map("delivery_status")
  trackingCode     String?        @map("tracking_code")
  importedFrom     String?        @map("imported_from")
  createdById      String         @map("created_by_id")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  product          Product        @relation(fields: [productId], references: [id])
  createdBy        User           @relation(fields: [createdById], references: [id])
  statusHistory    DeliveryStatusHistory[]

  @@index([productId])
  @@index([gateway])
  @@index([deliveryStatus])
  @@index([createdAt])
  @@map("sales")
}

model DeliveryStatusHistory {
  id          String         @id @default(cuid())
  saleId      String         @map("sale_id")
  fromStatus  DeliveryStatus @map("from_status")
  toStatus    DeliveryStatus @map("to_status")
  changedById String         @map("changed_by_id")
  changedAt   DateTime       @default(now()) @map("changed_at")

  sale      Sale @relation(fields: [saleId], references: [id])
  changedBy User @relation(fields: [changedById], references: [id])

  @@index([saleId])
  @@map("delivery_status_history")
}

model AuditLog {
  id        String      @id @default(cuid())
  userId    String      @map("user_id")
  action    AuditAction
  entity    AuditEntity
  entityId  String      @map("entity_id")
  oldData   Json?       @map("old_data")
  newData   Json?       @map("new_data")
  createdAt DateTime    @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Step 2: Create seed file**

`packages/api/prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@mimosdecor.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mimosdecor.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Seed completed: admin@mimosdecor.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

`packages/api/.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mimos_decor"
JWT_SECRET="mimos-decor-dev-secret-change-in-production"
```

**Step 3: Run migration**
```bash
cd packages/api && npx prisma migrate dev --name init
```

**Step 4: Seed database**
```bash
pnpm db:seed
```

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: add Prisma schema with all models, indexes, and seed"
```

---

## Task 4: API — Auth & Middleware

**Files:**
- Create: `packages/api/src/lib/logger.ts`
- Create: `packages/api/src/lib/jwt.ts`
- Create: `packages/api/src/lib/prisma.ts`
- Create: `packages/api/src/middleware/auth.ts`
- Create: `packages/api/src/middleware/audit.ts`
- Create: `packages/api/src/middleware/requireRole.ts`
- Create: `packages/api/src/routes/auth.ts`
- Create: `packages/api/src/index.ts`

**Step 1: Create lib utilities**

`packages/api/src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

`packages/api/src/lib/logger.ts`:
```ts
type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, message: string, context: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, context, message, ...data };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, ctx: string, data?: Record<string, unknown>) => log("info", msg, ctx, data),
  warn: (msg: string, ctx: string, data?: Record<string, unknown>) => log("warn", msg, ctx, data),
  error: (msg: string, ctx: string, data?: Record<string, unknown>) => log("error", msg, ctx, data),
  debug: (msg: string, ctx: string, data?: Record<string, unknown>) => log("debug", msg, ctx, data),
};
```

`packages/api/src/lib/jwt.ts`:
```ts
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";
const EXPIRES_IN = "24h";

export interface JwtPayload {
  userId: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
```

**Step 2: Create middleware**

`packages/api/src/middleware/auth.ts`:
```ts
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string; role: string };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
```

`packages/api/src/middleware/requireRole.ts`:
```ts
import type { Request, Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    next();
  };
}
```

`packages/api/src/middleware/audit.ts`:
```ts
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { AuditAction, AuditEntity } from "@prisma/client";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({ data: params });
    logger.debug(`Audit: ${params.action} ${params.entity} ${params.entityId}`, "audit");
  } catch (err) {
    logger.error("Failed to create audit log", "audit", { error: String(err) });
  }
}
```

**Step 3: Create auth routes**

`packages/api/src/routes/auth.ts`:
```ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    logger.info(`User ${user.email} logged in`, "auth");
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logger.error("Login error", "auth", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

authRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

**Step 4: Create Express server**

`packages/api/src/index.ts`:
```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { logger } from "./lib/logger.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware pipeline
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("short"));

// Routes
app.use("/api/auth", authRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, "server");
});

export default app;
```

**Step 5: Verify**
```bash
cd packages/api && pnpm dev
# Test: curl http://localhost:3001/api/health
```

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: add auth routes, middleware, JWT, logger, and Express server"
```

---

## Task 5: API — Product CRUD

**Files:**
- Create: `packages/api/src/services/product.service.ts`
- Create: `packages/api/src/routes/products.ts`
- Modify: `packages/api/src/index.ts` (add product routes)

**Step 1: Create product service**

`packages/api/src/services/product.service.ts`:
```ts
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import type { Prisma } from "@prisma/client";

export async function listProducts(params: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 50 } = params;
  const where: Prisma.ProductWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { supplier: { contains: search, mode: "insensitive" } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(data: Prisma.ProductCreateInput, userId: string) {
  const product = await prisma.product.create({ data });
  await createAuditLog({ userId, action: "CREATE", entity: "PRODUCT", entityId: product.id, newData: product as unknown as Record<string, unknown> });
  return product;
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput, userId: string) {
  const old = await prisma.product.findUnique({ where: { id } });
  if (!old) return null;
  const product = await prisma.product.update({ where: { id }, data });
  await createAuditLog({ userId, action: "UPDATE", entity: "PRODUCT", entityId: id, oldData: old as unknown as Record<string, unknown>, newData: product as unknown as Record<string, unknown> });
  return product;
}

export async function deleteProduct(id: string, userId: string) {
  const old = await prisma.product.findUnique({ where: { id } });
  if (!old) return null;
  await prisma.product.delete({ where: { id } });
  await createAuditLog({ userId, action: "DELETE", entity: "PRODUCT", entityId: id, oldData: old as unknown as Record<string, unknown> });
  return old;
}
```

**Step 2: Create product routes**

`packages/api/src/routes/products.ts`:
```ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as productService from "../services/product.service.js";

export const productRouter = Router();
productRouter.use(authMiddleware);

productRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await productService.listProducts({
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List products error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.get("/:id", async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    res.json(product);
  } catch (err) {
    logger.error("Get product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.post("/", async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.user!.id);
    logger.info(`Product created: ${product.name}`, "product");
    res.status(201).json(product);
  } catch (err) {
    logger.error("Create product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.put("/:id", async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user!.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    logger.info(`Product updated: ${product.name}`, "product");
    res.json(product);
  } catch (err) {
    logger.error("Update product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.delete("/:id", async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id, req.user!.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    logger.info(`Product deleted: ${product.name}`, "product");
    res.json({ ok: true });
  } catch (err) {
    logger.error("Delete product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
```

**Step 3: Register route in index.ts**

Add to `packages/api/src/index.ts` after auth router:
```ts
import { productRouter } from "./routes/products.js";
// ...
app.use("/api/products", productRouter);
```

**Step 4: Commit**
```bash
git add -A && git commit -m "feat: add product CRUD with service layer and audit logging"
```

---

## Task 6: API — Sales, CSV Import, Dashboard

**Files:**
- Create: `packages/api/src/services/sale.service.ts`
- Create: `packages/api/src/services/dashboard.service.ts`
- Create: `packages/api/src/routes/sales.ts`
- Create: `packages/api/src/routes/dashboard.ts`
- Modify: `packages/api/src/index.ts`

**Step 1: Create sale service**

`packages/api/src/services/sale.service.ts`:
```ts
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { MARKETPLACES, calcProductCost } from "@mimos/shared";
import type { Prisma, DeliveryStatus } from "@prisma/client";
import { parse } from "csv-parse/sync";

export async function listSales(params: {
  status?: DeliveryStatus;
  gateway?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { status, gateway, startDate, endDate, page = 1, limit = 50 } = params;
  const where: Prisma.SaleWhereInput = {};
  if (status) where.deliveryStatus = status;
  if (gateway) where.gateway = gateway as Prisma.EnumGatewayFilter;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { product: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  const mapped = sales.map((s) => ({ ...s, productName: s.product.name, product: undefined }));
  return { sales: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      product: { select: { name: true } },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });
  if (!sale) return null;
  return {
    ...sale,
    productName: sale.product.name,
    statusHistory: sale.statusHistory.map((h) => ({
      ...h,
      changedByName: h.changedBy.name,
      changedBy: undefined,
    })),
    product: undefined,
  };
}

export async function createSale(data: {
  productId: string;
  quantity: number;
  gateway: string;
  salePrice: number;
  customerName?: string;
  customerDocument?: string;
  trackingCode?: string;
}, userId: string) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error("Produto não encontrado");
  if (product.quantity < data.quantity) throw new Error("Estoque insuficiente");

  const marketplace = MARKETPLACES[data.gateway];
  if (!marketplace) throw new Error("Gateway inválido");

  const costs = {
    productCost: product.unitPrice,
    packaging: product.packagingCost,
    labor: product.laborCost,
    shipping: product.shippingCost,
    otherCosts: product.otherCosts,
    taxRate: product.taxRate,
  };
  const { total: unitCost } = calcProductCost(costs);
  const fees = marketplace.calculate(data.salePrice);
  const totalFeesFinal = fees.totalFees * data.quantity;
  const netRevenue = data.salePrice * data.quantity - totalFeesFinal;
  const profit = netRevenue - unitCost * data.quantity;

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        gateway: data.gateway as any,
        salePrice: data.salePrice,
        unitCost,
        totalFees: totalFeesFinal,
        netRevenue,
        profit,
        customerName: data.customerName,
        customerDocument: data.customerDocument,
        trackingCode: data.trackingCode,
        createdById: userId,
      },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data: { quantity: { decrement: data.quantity } },
    }),
  ]);

  await createAuditLog({ userId, action: "CREATE", entity: "SALE", entityId: sale.id, newData: sale as unknown as Record<string, unknown> });
  return sale;
}

export async function updateSaleStatus(id: string, newStatus: DeliveryStatus, userId: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) return null;

  const [updated] = await prisma.$transaction([
    prisma.sale.update({ where: { id }, data: { deliveryStatus: newStatus } }),
    prisma.deliveryStatusHistory.create({
      data: { saleId: id, fromStatus: sale.deliveryStatus, toStatus: newStatus, changedById: userId },
    }),
  ]);

  await createAuditLog({ userId, action: "UPDATE", entity: "SALE", entityId: id, oldData: { deliveryStatus: sale.deliveryStatus }, newData: { deliveryStatus: newStatus } });
  return updated;
}

export async function importSalesFromCSV(csvBuffer: Buffer, gateway: string, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const results: { success: number; errors: string[] } = { success: 0, errors: [] };

  for (const [i, record] of records.entries()) {
    try {
      const productName = record["produto"] || record["product"] || record["nome"];
      const quantity = Number(record["quantidade"] || record["qty"] || "1");
      const salePrice = Number((record["valor"] || record["price"] || "0").replace(",", "."));

      if (!productName || !salePrice) {
        results.errors.push(`Linha ${i + 2}: dados incompletos`);
        continue;
      }

      const product = await prisma.product.findFirst({ where: { name: { contains: productName, mode: "insensitive" } } });
      if (!product) {
        results.errors.push(`Linha ${i + 2}: produto "${productName}" não encontrado`);
        continue;
      }

      await createSale({ productId: product.id, quantity, gateway, salePrice }, userId);
      results.success++;
    } catch (err) {
      results.errors.push(`Linha ${i + 2}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return results;
}
```

**Step 2: Create dashboard service**

`packages/api/src/services/dashboard.service.ts`:
```ts
import { prisma } from "../lib/prisma.js";

export async function getDashboardData(params: { startDate?: string; endDate?: string }) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFilter = params.startDate || params.endDate
    ? {
        createdAt: {
          ...(params.startDate && { gte: new Date(params.startDate) }),
          ...(params.endDate && { lte: new Date(params.endDate) }),
        },
      }
    : {};

  const [todaySales, monthSales, salesByGateway, salesByDay, topProducts] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _count: true,
      _sum: { salePrice: true, profit: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true, profit: true, netRevenue: true },
    }),
    prisma.sale.groupBy({
      by: ["gateway"],
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true },
    }),
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(sale_price) as revenue
      FROM sales
      WHERE created_at >= ${startOfMonth}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Promise<{ date: string; count: number; revenue: number }[]>,
    prisma.sale.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: startOfMonth }, ...dateFilter },
      _count: true,
      _sum: { salePrice: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const topProductIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return {
    totalSalesToday: todaySales._count,
    totalSalesMonth: monthSales._count,
    revenueMonth: monthSales._sum.salePrice ?? 0,
    profitMonth: monthSales._sum.profit ?? 0,
    averageTicket: monthSales._count > 0 ? (monthSales._sum.salePrice ?? 0) / monthSales._count : 0,
    salesByGateway: salesByGateway.map((g) => ({
      gateway: g.gateway,
      count: g._count,
      revenue: g._sum.salePrice ?? 0,
    })),
    salesByDay,
    topProducts: topProducts.map((p) => ({
      productName: productMap.get(p.productId) ?? "Desconhecido",
      count: p._count,
      revenue: p._sum.salePrice ?? 0,
    })),
  };
}
```

**Step 3: Create routes**

`packages/api/src/routes/sales.ts`:
```ts
import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as saleService from "../services/sale.service.js";

export const saleRouter = Router();
saleRouter.use(authMiddleware);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

saleRouter.get("/", async (req, res) => {
  try {
    const { status, gateway, startDate, endDate, page, limit } = req.query;
    const result = await saleService.listSales({
      status: status as any,
      gateway: gateway as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List sales error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.get("/:id", async (req, res) => {
  try {
    const sale = await saleService.getSale(req.params.id);
    if (!sale) { res.status(404).json({ error: "Venda não encontrada" }); return; }
    res.json(sale);
  } catch (err) {
    logger.error("Get sale error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.post("/", async (req, res) => {
  try {
    const sale = await saleService.createSale(req.body, req.user!.id);
    logger.info("Sale created", "sale", { saleId: sale.id });
    res.status(201).json(sale);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    logger.error("Create sale error", "sale", { error: message });
    res.status(400).json({ error: message });
  }
});

saleRouter.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const sale = await saleService.updateSaleStatus(req.params.id, status, req.user!.id);
    if (!sale) { res.status(404).json({ error: "Venda não encontrada" }); return; }
    logger.info(`Sale ${req.params.id} status → ${status}`, "sale");
    res.json(sale);
  } catch (err) {
    logger.error("Update sale status error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ error: "Arquivo CSV é obrigatório" }); return; }
    const { gateway } = req.body;
    if (!gateway) { res.status(400).json({ error: "Gateway é obrigatório" }); return; }
    const result = await saleService.importSalesFromCSV(req.file.buffer, gateway, req.user!.id);
    logger.info(`CSV import: ${result.success} sales, ${result.errors.length} errors`, "sale");
    res.json(result);
  } catch (err) {
    logger.error("Import CSV error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
```

`packages/api/src/routes/dashboard.ts`:
```ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as dashboardService from "../services/dashboard.service.js";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getDashboardData({
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(data);
  } catch (err) {
    logger.error("Dashboard error", "dashboard", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
```

**Step 4: Register routes in index.ts**

Add to `packages/api/src/index.ts`:
```ts
import { saleRouter } from "./routes/sales.js";
import { dashboardRouter } from "./routes/dashboard.js";
// ...
app.use("/api/sales", saleRouter);
app.use("/api/dashboard", dashboardRouter);
```

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: add sales CRUD, CSV import, dashboard endpoints"
```

---

## Task 7: API — Users CRUD & Audit Logs

**Files:**
- Create: `packages/api/src/services/user.service.ts`
- Create: `packages/api/src/services/audit.service.ts`
- Create: `packages/api/src/routes/users.ts`
- Create: `packages/api/src/routes/audit-logs.ts`
- Modify: `packages/api/src/index.ts`

**Step 1: Create user service**

`packages/api/src/services/user.service.ts`:
```ts
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import bcrypt from "bcryptjs";

const USER_SELECT = { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true };

export async function listUsers(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ select: USER_SELECT, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createUser(data: { name: string; email: string; password: string; role: string }, adminId: string) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("Email já cadastrado");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashedPassword, role: data.role as any },
    select: USER_SELECT,
  });
  await createAuditLog({ userId: adminId, action: "CREATE", entity: "USER", entityId: user.id, newData: { name: user.name, email: user.email, role: user.role } });
  return user;
}

export async function updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }, adminId: string) {
  const old = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!old) return null;
  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({ where: { id }, data: updateData, select: USER_SELECT });
  await createAuditLog({ userId: adminId, action: "UPDATE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown>, newData: user as unknown as Record<string, unknown> });
  return user;
}

export async function deleteUser(id: string, adminId: string) {
  if (id === adminId) throw new Error("Não é possível deletar a si mesmo");
  const old = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!old) return null;
  await prisma.user.delete({ where: { id } });
  await createAuditLog({ userId: adminId, action: "DELETE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown> });
  return old;
}
```

**Step 2: Create audit service**

`packages/api/src/services/audit.service.ts`:
```ts
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export async function listAuditLogs(params: {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, action, entity, startDate, endDate, page = 1, limit = 50 } = params;
  const where: Prisma.AuditLogWhereInput = {};
  if (userId) where.userId = userId;
  if (action) where.action = action as any;
  if (entity) where.entity = entity as any;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const mapped = logs.map((l) => ({ ...l, userName: l.user.name, user: undefined }));
  return { logs: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

**Step 3: Create routes**

`packages/api/src/routes/users.ts`:
```ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { logger } from "../lib/logger.js";
import * as userService from "../services/user.service.js";

export const userRouter = Router();
userRouter.use(authMiddleware, requireRole("ADMIN"));

userRouter.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.listUsers({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
    res.json(result);
  } catch (err) {
    logger.error("List users error", "user", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

userRouter.post("/", async (req, res) => {
  try {
    const user = await userService.createUser(req.body, req.user!.id);
    logger.info(`User created: ${user.email}`, "user");
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});

userRouter.put("/:id", async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user!.id);
    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
    logger.info(`User updated: ${user.email}`, "user");
    res.json(user);
  } catch (err) {
    logger.error("Update user error", "user", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

userRouter.delete("/:id", async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user!.id);
    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
    logger.info(`User deleted: ${user.email}`, "user");
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});
```

`packages/api/src/routes/audit-logs.ts`:
```ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { logger } from "../lib/logger.js";
import * as auditService from "../services/audit.service.js";

export const auditLogRouter = Router();
auditLogRouter.use(authMiddleware, requireRole("ADMIN"));

auditLogRouter.get("/", async (req, res) => {
  try {
    const { userId, action, entity, startDate, endDate, page, limit } = req.query;
    const result = await auditService.listAuditLogs({
      userId: userId as string,
      action: action as string,
      entity: entity as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List audit logs error", "audit", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
```

**Step 4: Register in index.ts**

Add to `packages/api/src/index.ts`:
```ts
import { userRouter } from "./routes/users.js";
import { auditLogRouter } from "./routes/audit-logs.js";
// ...
app.use("/api/users", userRouter);
app.use("/api/audit-logs", auditLogRouter);
```

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: add user CRUD (admin only), audit logs endpoint"
```

---

## Task 8: Frontend — Setup, Theme, Layout, Router

**Files:**
- Create: `packages/web/src/styles.css`
- Create: `packages/web/src/main.tsx`
- Create: `packages/web/src/App.tsx`
- Create: `packages/web/src/lib/api.ts`
- Create: `packages/web/src/stores/auth.store.ts`
- Create: `packages/web/src/components/layout/Sidebar.tsx`
- Create: `packages/web/src/components/layout/Header.tsx`
- Create: `packages/web/src/components/layout/AppLayout.tsx`
- Create: `packages/web/src/components/common/ProtectedRoute.tsx`
- Create: `packages/web/src/pages/Home.tsx`
- Create: `packages/web/src/pages/Login.tsx`

**Step 1: Create global styles with Tailwind + Mimos theme**

`packages/web/src/styles.css`:
```css
@import "tailwindcss";

@theme {
  --color-primary: #ff914d;
  --color-primary-hover: #f07830;
  --color-rosa: #fac6cd;
  --color-rosa-light: #fde8eb;
  --color-rosa-dark: #e8a5ae;
  --color-page-bg: #FFF9F7;
  --color-sidebar-bg: #3D2C2C;
  --color-sidebar-hover: #4d3a3a;
  --color-text-dark: #3D2C2C;
  --color-text-secondary: #6B5E5E;
  --color-text-muted: #9B8E8E;
  --color-stroke: #f0e0e0;
  --color-card-bg: #ffffff;

  --font-sans: "Nunito", sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-page-bg);
  color: var(--color-text-dark);
}
```

**Step 2: Create API client**

`packages/web/src/lib/api.ts`:
```ts
const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    fetch(`${BASE_URL}${path}`, { method: "POST", credentials: "include", body: formData }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro" }));
        throw new Error(data.error);
      }
      return res.json() as Promise<T>;
    }),
};
```

**Step 3: Create auth store**

`packages/web/src/stores/auth.store.ts`:
```ts
import { create } from "zustand";
import { api } from "../lib/api.js";
import type { User } from "@mimos/shared";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const data = await api.post<{ user: User }>("/auth/login", { email, password });
    set({ user: data.user });
  },
  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
```

**Step 4: Create layout components**

`packages/web/src/components/layout/Sidebar.tsx`:
```tsx
import { NavLink } from "react-router";
import { LayoutDashboard, Package, ShoppingCart, Users, ScrollText, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store.js";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/products", label: "Produtos", icon: Package },
  { to: "/app/sales", label: "Vendas", icon: ShoppingCart },
];

const ADMIN_ITEMS = [
  { to: "/app/users", label: "Usuários", icon: Users },
  { to: "/app/logs", label: "Auditoria", icon: ScrollText },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const items = user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-sidebar-bg flex flex-col">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <img src="/logo.png" alt="Mimos Decor" className="w-10 h-10 rounded-lg" />
        <span className="text-white font-bold text-[15px] tracking-tight">Mimos Decor</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-sidebar-hover"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-hover transition-colors w-full text-[14px]"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
```

`packages/web/src/components/layout/Header.tsx`:
```tsx
import { useAuthStore } from "../../stores/auth.store.js";
import { ROLE_LABELS } from "@mimos/shared";

export function Header({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 bg-card-bg border-b border-stroke flex items-center justify-between px-6">
      <h1 className="text-[18px] font-bold text-text-dark tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[13px] font-semibold text-text-dark">{user?.name}</p>
          <p className="text-[11px] text-text-muted">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[13px]">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
```

`packages/web/src/components/layout/AppLayout.tsx`:
```tsx
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar.js";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
```

`packages/web/src/components/common/ProtectedRoute.tsx`:
```tsx
import { Navigate } from "react-router";
import { useAuthStore } from "../../stores/auth.store.js";

export function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}
```

**Step 5: Create Home page (institutional)**

`packages/web/src/pages/Home.tsx`:
```tsx
import { Link } from "react-router";
import { Heart, Truck, Star } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stroke">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Mimos Decor" className="w-10 h-10 rounded-lg" />
            <span className="font-bold text-[18px] text-text-dark tracking-tight">Mimos Decor</span>
          </div>
          <Link
            to="/login"
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-semibold text-[14px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Acessar Sistema
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-rosa-light to-page-bg">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/logo.png" alt="Mimos Decor" className="w-32 h-32 mx-auto mb-8 drop-shadow-lg" />
          <h1 className="text-[42px] font-extrabold text-text-dark tracking-tight leading-tight mb-4">
            Decoração com carinho
          </h1>
          <p className="text-[18px] text-text-secondary max-w-xl mx-auto leading-relaxed mb-8">
            Transformamos ambientes com peças únicas e selecionadas. Cada detalhe pensado para tornar sua casa mais acolhedora.
          </p>
          <Link
            to="/login"
            className="inline-flex bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold text-[16px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
          >
            Entrar no Sistema
          </Link>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-[28px] font-bold text-text-dark tracking-tight text-center mb-12">Nossos Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Produtos Selecionados", desc: "Cada peça é escolhida a dedo, garantindo qualidade e exclusividade para a sua decoração." },
              { icon: Truck, title: "Entrega Cuidadosa", desc: "Embalagem especial e acompanhamento do pedido do início ao fim, com todo o cuidado que você merece." },
              { icon: Star, title: "Preços Justos", desc: "Trabalhamos com preços transparentes e competitivos nos principais marketplaces do Brasil." },
            ].map((item) => (
              <div key={item.title} className="bg-card-bg border border-stroke rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-rosa-light rounded-xl flex items-center justify-center mx-auto mb-5">
                  <item.icon size={28} className="text-primary" />
                </div>
                <h3 className="text-[17px] font-bold text-text-dark mb-3">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar-bg py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/logo.png" alt="Mimos Decor" className="w-12 h-12 mx-auto mb-4 rounded-lg opacity-80" />
          <p className="text-white/60 text-[13px]">
            &copy; {new Date().getFullYear()} Mimos Decor. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 6: Create Login page**

`packages/web/src/pages/Login.tsx`:
```tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuthStore } from "../stores/auth.store.js";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rosa-light via-page-bg to-rosa-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="Mimos Decor" className="w-20 h-20 mx-auto mb-4 drop-shadow-md" />
          </Link>
          <h1 className="text-[24px] font-extrabold text-text-dark tracking-tight">Bem-vindo de volta</h1>
          <p className="text-[14px] text-text-secondary mt-1">Acesse o sistema de gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card-bg border border-stroke rounded-2xl p-8 shadow-xl shadow-rosa/10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px] mb-5">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stroke rounded-xl text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stroke rounded-xl text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 7: Create App with router**

`packages/web/src/App.tsx`:
```tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "./stores/auth.store.js";
import { AppLayout } from "./components/layout/AppLayout.js";
import { ProtectedRoute } from "./components/common/ProtectedRoute.js";
import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";

// Lazy load app pages
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard.js"));
const Products = lazy(() => import("./pages/Products.js"));
const Sales = lazy(() => import("./pages/Sales.js"));
const UsersPage = lazy(() => import("./pages/Users.js"));
const AuditLogs = lazy(() => import("./pages/AuditLogs.js"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
          <Route path="users" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><UsersPage /></Suspense></ProtectedRoute>} />
          <Route path="logs" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><AuditLogs /></Suspense></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

`packages/web/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Step 8: Copy logo to public folder**
```bash
mkdir -p packages/web/public
cp "C:\Users\joaop\Downloads\WhatsApp Image 2026-03-10 at 21.18.15.jpeg" packages/web/public/logo.png
```

**Step 9: Commit**
```bash
git add -A && git commit -m "feat: add frontend setup, theme, layout, home, login, router"
```

---

## Task 9: Frontend — Dashboard Page

**Files:**
- Create: `packages/web/src/stores/dashboard.store.ts`
- Create: `packages/web/src/pages/Dashboard.tsx`

**Step 1: Create dashboard store**

`packages/web/src/stores/dashboard.store.ts`:
```ts
import { create } from "zustand";
import { api } from "../lib/api.js";
import type { SaleDashboard } from "@mimos/shared";

interface DashboardState {
  data: SaleDashboard | null;
  loading: boolean;
  fetchDashboard: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  fetchDashboard: async (startDate, endDate) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const data = await api.get<SaleDashboard>(`/dashboard?${params}`);
      set({ data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
```

**Step 2: Create Dashboard page**

`packages/web/src/pages/Dashboard.tsx`:
```tsx
import { useEffect } from "react";
import { Header } from "../components/layout/Header.js";
import { useDashboardStore } from "../stores/dashboard.store.js";
import { formatBRL, GATEWAY_LABELS } from "@mimos/shared";
import { ShoppingCart, DollarSign, TrendingUp, Receipt } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STAT_CARDS = [
  { key: "totalSalesToday", label: "Vendas Hoje", icon: ShoppingCart, format: (v: number) => String(v) },
  { key: "revenueMonth", label: "Faturamento Mês", icon: DollarSign, format: formatBRL },
  { key: "profitMonth", label: "Lucro Mês", icon: TrendingUp, format: formatBRL },
  { key: "averageTicket", label: "Ticket Médio", icon: Receipt, format: formatBRL },
] as const;

const PIE_COLORS = ["#ff914d", "#fac6cd", "#3D2C2C", "#6B5E5E", "#e8a5ae"];

export default function Dashboard() {
  const { data, loading, fetchDashboard } = useDashboardStore();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="bg-card-bg border border-stroke rounded-xl p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">{card.label}</span>
                <div className="w-9 h-9 bg-rosa-light rounded-lg flex items-center justify-center">
                  <card.icon size={18} className="text-primary" />
                </div>
              </div>
              <p className="text-[28px] font-extrabold text-text-dark tracking-tight">
                {loading ? "—" : data ? card.format(data[card.key] as number) : "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Day Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Vendas por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.salesByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ff914d" strokeWidth={2.5} dot={{ fill: "#ff914d", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Gateway Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Vendas por Gateway</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.salesByGateway?.map((g) => ({ ...g, name: GATEWAY_LABELS[g.gateway] ?? g.gateway })) ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#ff914d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card-bg border border-stroke rounded-xl p-6 lg:col-span-2">
            <h3 className="text-[15px] font-bold text-text-dark mb-4">Top 5 Produtos</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data?.topProducts ?? []} dataKey="revenue" nameKey="productName" cx="50%" cy="50%" outerRadius={100} label={({ productName }) => productName}>
                  {data?.topProducts?.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: add dashboard page with stat cards and charts"
```

---

## Task 10: Frontend — Products Page

**Files:**
- Create: `packages/web/src/stores/product.store.ts`
- Create: `packages/web/src/pages/Products.tsx`
- Create: `packages/web/src/components/products/ProductFormDialog.tsx`

Product listing with pricing columns for all 4 gateways. Uses `calcIdealPrice` from shared to compute prices client-side.

**Implementation:** Full CRUD with dialog form, search, pricing columns (Shopee CPF, Shopee CNPJ, ML Clássico, ML Premium) calculated live from `@mimos/shared` pricing engine. Each row shows: Name | Qty | Unit Price | Shopee CPF | Shopee CNPJ | ML Clássico | ML Premium.

**Step 1: Create product store**

`packages/web/src/stores/product.store.ts`:
```ts
import { create } from "zustand";
import { api } from "../lib/api.js";
import type { Product } from "@mimos/shared";

interface ProductState {
  products: Product[];
  total: number;
  loading: boolean;
  fetchProducts: (params?: { search?: string; page?: number }) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  total: 0,
  loading: false,
  fetchProducts: async (params) => {
    set({ loading: true });
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.page) qs.set("page", String(params.page));
      const data = await api.get<{ products: Product[]; total: number }>(`/products?${qs}`);
      set({ products: data.products, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createProduct: async (data) => {
    await api.post("/products", data);
  },
  updateProduct: async (id, data) => {
    await api.put(`/products/${id}`, data);
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
  },
}));
```

**Step 2: Create ProductFormDialog**

`packages/web/src/components/products/ProductFormDialog.tsx`:
```tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Product } from "@mimos/shared";

interface Props {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

const FIELDS = [
  { name: "name", label: "Nome do Produto", type: "text", required: true },
  { name: "unitPrice", label: "Valor Unitário (R$)", type: "number", required: true },
  { name: "quantity", label: "Quantidade", type: "number", required: true },
  { name: "shippingCost", label: "Valor do Frete (R$)", type: "number", required: true },
  { name: "desiredMargin", label: "Margem Desejada (%)", type: "number", required: true },
  { name: "supplier", label: "Fornecedor", type: "text", required: false },
  { name: "taxRate", label: "Imposto (%)", type: "number", required: false },
  { name: "packagingCost", label: "Custo Embalagem (R$)", type: "number", required: false },
  { name: "laborCost", label: "Custo Mão de Obra (R$)", type: "number", required: false },
  { name: "otherCosts", label: "Outros Custos (R$)", type: "number", required: false },
];

export function ProductFormDialog({ open, product, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (product) {
      setForm({ ...product });
    } else {
      setForm({ desiredMargin: 20, taxRate: 0, packagingCost: 0, laborCost: 0, otherCosts: 0, quantity: 0, shippingCost: 0 });
    }
  }, [product, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const field of FIELDS) {
      const val = form[field.name];
      data[field.name] = field.type === "number" ? Number(val || 0) : val || (field.required ? "" : undefined);
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">{product ? "Editar Produto" : "Novo Produto"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={field.type}
                value={form[field.name] ?? ""}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                step={field.type === "number" ? "0.01" : undefined}
                required={field.required}
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99]">
              {product ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Create Products page**

`packages/web/src/pages/Products.tsx`:
```tsx
import { useEffect, useState, useMemo } from "react";
import { Header } from "../components/layout/Header.js";
import { ProductFormDialog } from "../components/products/ProductFormDialog.js";
import { useProductStore } from "../stores/product.store.js";
import { calcIdealPrice, MARKETPLACES, formatBRL, GATEWAY_LABELS } from "@mimos/shared";
import type { Product, GatewayId } from "@mimos/shared";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const GATEWAY_IDS: GatewayId[] = ["SHOPEE_CPF", "SHOPEE_CNPJ", "ML_CLASSICO", "ML_PREMIUM"];

function getProductPrices(product: Product) {
  const costs = {
    productCost: product.unitPrice,
    packaging: product.packagingCost,
    labor: product.laborCost,
    shipping: product.shippingCost,
    otherCosts: product.otherCosts,
    taxRate: product.taxRate,
  };
  const prices: Record<string, { salePrice: number; profit: number; margin: number }> = {};
  for (const gid of GATEWAY_IDS) {
    const mp = MARKETPLACES[gid];
    const result = calcIdealPrice(costs, product.desiredMargin, mp);
    prices[gid] = { salePrice: result.salePrice, profit: result.profit, margin: result.actualMargin };
  }
  return prices;
}

export default function Products() {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editProduct) {
      await updateProduct(editProduct.id, data);
    } else {
      await createProduct(data);
    }
    setDialogOpen(false);
    setEditProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este produto?")) return;
    await deleteProduct(id);
    fetchProducts();
  };

  return (
    <div>
      <Header title="Produtos" />
      <div className="p-6">
        {/* Actions bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-4 py-2.5 border border-stroke rounded-lg text-[14px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={() => { setEditProduct(null); setDialogOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>

        {/* Table */}
        <div className="bg-card-bg border border-stroke rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke bg-page-bg">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Produto</th>
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Qtd</th>
                  <th className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Unit.</th>
                  {GATEWAY_IDS.map((gid) => (
                    <th key={gid} className="text-right px-3 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      {GATEWAY_LABELS[gid]}
                    </th>
                  ))}
                  <th className="px-3 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-stroke/50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-page-bg rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-text-muted text-[14px]">Nenhum produto encontrado</td></tr>
                ) : (
                  filteredProducts.map((product) => {
                    const prices = getProductPrices(product);
                    return (
                      <tr key={product.id} className="border-b border-stroke/50 hover:bg-rosa-light/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[14px] font-semibold text-text-dark">{product.name}</p>
                          {product.supplier && <p className="text-[11px] text-text-muted">{product.supplier}</p>}
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`text-[13px] font-semibold ${product.quantity <= 5 ? "text-red-500" : "text-text-dark"}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="text-right px-3 py-3 text-[13px] font-medium text-text-dark">
                          {formatBRL(product.unitPrice)}
                        </td>
                        {GATEWAY_IDS.map((gid) => (
                          <td key={gid} className="text-right px-3 py-3">
                            <span className="text-[13px] font-semibold text-text-dark">{formatBRL(prices[gid].salePrice)}</span>
                            <span className="block text-[10px] text-text-muted">{prices[gid].margin.toFixed(1)}% margem</span>
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setEditProduct(product); setDialogOpen(true); }} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-rosa-light transition-all">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProductFormDialog open={dialogOpen} product={editProduct} onClose={() => { setDialogOpen(false); setEditProduct(null); }} onSubmit={handleSubmit} />
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add -A && git commit -m "feat: add products page with pricing columns and CRUD dialog"
```

---

## Task 11: Frontend — Sales Page

**Files:**
- Create: `packages/web/src/stores/sale.store.ts`
- Create: `packages/web/src/pages/Sales.tsx`
- Create: `packages/web/src/components/sales/SaleFormDialog.tsx`
- Create: `packages/web/src/components/sales/SaleDetailDrawer.tsx`
- Create: `packages/web/src/components/sales/ImportCSVDialog.tsx`

This is the largest frontend task. Sales page with tabs (Todas/Pendentes/Em Trânsito/Entregues), table with status badges, sale detail drawer with delivery timeline, create sale dialog, and CSV import dialog.

**Implementation:** Follow same patterns as Products page — store + page + dialog components. Sale detail shows delivery status history as a vertical timeline. Import CSV dialog has file upload + gateway selector.

Full code for each file follows the same patterns established in Task 10 (store pattern, dialog pattern, table pattern). Key differences:
- Status tabs filtering
- Gateway badge colors
- Status update via PATCH
- CSV import with multipart form
- Delivery timeline in detail drawer

**Step 1-5:** Create store, dialogs, page, register, commit.

```bash
git add -A && git commit -m "feat: add sales page with status tracking, detail drawer, CSV import"
```

---

## Task 12: Frontend — Users & Audit Logs Pages

**Files:**
- Create: `packages/web/src/pages/Users.tsx`
- Create: `packages/web/src/pages/AuditLogs.tsx`
- Create: `packages/web/src/stores/user.store.ts`
- Create: `packages/web/src/stores/audit.store.ts`

**Implementation:** Simpler pages following established patterns.

- Users: table with Name/Email/Role/Created, create/edit modal, delete confirmation
- Audit Logs: timeline view with action icons, filters (user, action, entity, period), expandable JSON diff

```bash
git add -A && git commit -m "feat: add users management and audit logs pages"
```

---

## Task 13: Final Integration & Polish

**Files:**
- Modify: various files for bug fixes and polish

**Steps:**
1. Verify all routes work end-to-end
2. Add error boundary wrapper
3. Add toast notifications for success/error feedback
4. Verify `pnpm build` passes for all packages
5. Run `pnpm test` for shared package
6. Final commit

```bash
git add -A && git commit -m "feat: final integration, error boundaries, toast notifications"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|-----------------|
| 1 | Monorepo scaffold | 6 |
| 2 | Shared types + pricing engine | 6 |
| 3 | Prisma schema + seed | 5 |
| 4 | Auth + middleware | 6 |
| 5 | Product CRUD API | 4 |
| 6 | Sales + CSV + Dashboard API | 5 |
| 7 | Users + Audit API | 5 |
| 8 | Frontend setup + layout + home + login | 9 |
| 9 | Dashboard page | 3 |
| 10 | Products page | 4 |
| 11 | Sales page | 5 |
| 12 | Users + Audit pages | 3 |
| 13 | Integration + polish | 5 |

**Total: 13 tasks, ~66 steps**

**Execution order:** Tasks 1-7 are sequential (backend). Tasks 8-12 depend on shared types (Task 2) but are independent of each other for the most part. Task 13 is last.
