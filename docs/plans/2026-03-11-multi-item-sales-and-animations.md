# Multi-Item Sales + App-Wide Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor sales to support multiple products per sale (with auto-calculated prices from product pricing engine), and add polished animations across the entire application.

**Architecture:** Sale becomes a parent entity (gateway, customer, totals) with a `SaleItem` child table (productId, quantity, salePrice, unitCost, fees, profit per item). The `salePrice` is auto-calculated from `calcIdealPrice()` based on the product costs + selected gateway — user only picks product + quantity. App-wide animations use CSS keyframes in Tailwind v4 `@theme` syntax.

**Tech Stack:** Prisma (PostgreSQL), Express, React 19, Zustand 5, Tailwind CSS v4, Recharts

---

## Task 1: Prisma Schema — Add SaleItem, Refactor Sale

**Files:**
- Modify: `packages/api/prisma/schema.prisma`

**Step 1: Update the Prisma schema**

Replace the existing `Sale` model and add `SaleItem`:

```prisma
model Sale {
  id               String         @id @default(cuid())
  gateway          Gateway
  salePrice        Float          @map("sale_price")       // total across all items
  totalCost        Float          @map("total_cost")       // total cost across all items
  totalFees        Float          @map("total_fees")       // total fees across all items
  netRevenue       Float          @map("net_revenue")      // salePrice - totalFees
  profit           Float                                    // netRevenue - totalCost
  customerName     String?        @map("customer_name")
  customerDocument String?        @map("customer_document")
  deliveryStatus   DeliveryStatus @default(PENDING) @map("delivery_status")
  trackingCode     String?        @map("tracking_code")
  importedFrom     String?        @map("imported_from")
  createdById      String         @map("created_by_id")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  items            SaleItem[]
  createdBy        User           @relation(fields: [createdById], references: [id])
  statusHistory    DeliveryStatusHistory[]

  @@index([gateway])
  @@index([deliveryStatus])
  @@index([createdAt])
  @@map("sales")
}

model SaleItem {
  id        String @id @default(cuid())
  saleId    String @map("sale_id")
  productId String @map("product_id")
  quantity  Int
  salePrice Float  @map("sale_price")   // unit sale price × quantity
  unitCost  Float  @map("unit_cost")    // cost per unit from calcProductCost
  totalFees Float  @map("total_fees")   // marketplace fees for this item
  profit    Float                        // salePrice - totalFees - (unitCost × quantity)

  sale    Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([saleId])
  @@index([productId])
  @@map("sale_items")
}
```

Also update `Product` model — replace `sales Sale[]` with `saleItems SaleItem[]`.

Remove the `productId` field and `product` relation from `Sale`.

**Step 2: Create migration**

Run: `cd packages/api && npx prisma migrate dev --name multi-item-sales`

This will fail if there is existing data because `productId` is being removed. The migration SQL must:
1. Create `sale_items` table
2. Migrate existing sales: INSERT INTO sale_items (from each existing sale's productId, quantity, salePrice, unitCost, totalFees, profit)
3. Drop `product_id` column from `sales`
4. Add `total_cost` column to `sales` (calculated from unitCost × quantity)

Use `--create-only` then edit the migration SQL manually to include data migration.

Run: `cd packages/api && npx prisma migrate dev --name multi-item-sales --create-only`

Then edit the generated migration to include:

```sql
-- 1. Add new columns to sales
ALTER TABLE "sales" ADD COLUMN "total_cost" DOUBLE PRECISION;

-- 2. Create sale_items table
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_fees" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- 3. Migrate existing data
INSERT INTO "sale_items" ("id", "sale_id", "product_id", "quantity", "sale_price", "unit_cost", "total_fees", "profit")
SELECT gen_random_uuid()::text, "id", "product_id", "quantity", "sale_price", "unit_cost", "total_fees", "profit"
FROM "sales";

-- 4. Populate total_cost from existing data
UPDATE "sales" SET "total_cost" = "unit_cost" * "quantity";

-- 5. Make total_cost NOT NULL
ALTER TABLE "sales" ALTER COLUMN "total_cost" SET NOT NULL;

-- 6. Drop old columns from sales
ALTER TABLE "sales" DROP COLUMN "product_id";
ALTER TABLE "sales" DROP COLUMN "quantity";
ALTER TABLE "sales" DROP COLUMN "unit_cost";

-- 7. Add indexes
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- 8. Add foreign keys
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Then run: `cd packages/api && npx prisma migrate dev`

Then run: `cd packages/api && npx prisma generate`

**Step 3: Commit**

```bash
git add packages/api/prisma/
git commit -m "feat: add SaleItem model, migrate Sale to multi-item"
```

---

## Task 2: Shared Types — Update Sale Types for Multi-Item

**Files:**
- Modify: `packages/shared/src/types/sale.ts`

**Step 1: Update the types**

```typescript
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

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
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
  customerName: string | null;
  customerDocument: string | null;
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

**Step 2: Build shared to verify**

Run: `cd packages/shared && pnpm build`

**Step 3: Commit**

```bash
git add packages/shared/
git commit -m "feat: update Sale types for multi-item support"
```

---

## Task 3: Backend — Refactor sale.service.ts

**Files:**
- Modify: `packages/api/src/services/sale.service.ts`

**Step 1: Rewrite createSale**

The new `createSale` receives `{ gateway, items: [{ productId, quantity }], ... }`.

For each item:
1. Fetch the product
2. Validate stock
3. Calculate `unitCost` via `calcProductCost()`
4. Calculate `salePrice` via `calcIdealPrice()` for the selected gateway
5. Calculate marketplace fees via `marketplace.calculate(salePrice)`
6. Calculate item profit

Then create `Sale` + `SaleItem[]` in a transaction, decrement product stock for each item.

```typescript
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { MARKETPLACES, calcProductCost, calcIdealPrice } from "@mimos/shared";
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
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  const mapped = sales.map((s) => ({
    ...s,
    items: s.items.map((item) => ({
      ...item,
      productName: item.product.name,
      product: undefined,
    })),
  }));

  return { sales: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });
  if (!sale) return null;
  return {
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      productName: item.product.name,
      product: undefined,
    })),
    statusHistory: sale.statusHistory.map((h) => ({
      ...h,
      changedByName: h.changedBy.name,
      changedBy: undefined,
    })),
  };
}

export async function createSale(data: {
  gateway: string;
  items: { productId: string; quantity: number }[];
  customerName?: string;
  customerDocument?: string;
  trackingCode?: string;
}, userId: string) {
  if (!data.items.length) throw new Error("A venda precisa ter ao menos um item");

  const marketplace = MARKETPLACES[data.gateway];
  if (!marketplace) throw new Error("Gateway inválido");

  // Fetch all products in one query
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate and calculate per item
  const itemsData: {
    productId: string;
    quantity: number;
    salePrice: number;
    unitCost: number;
    totalFees: number;
    profit: number;
  }[] = [];

  let saleTotalPrice = 0;
  let saleTotalCost = 0;
  let saleTotalFees = 0;

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Produto não encontrado: ${item.productId}`);
    if (product.quantity < item.quantity) throw new Error(`Estoque insuficiente para "${product.name}"`);

    const costs = {
      productCost: product.unitPrice,
      packaging: product.packagingCost,
      labor: product.laborCost,
      shipping: product.shippingCost,
      otherCosts: product.otherCosts,
      taxRate: product.taxRate,
    };

    const { total: unitCost } = calcProductCost(costs);
    const pricing = calcIdealPrice(costs, product.desiredMargin, marketplace);
    const itemSalePrice = pricing.salePrice * item.quantity;
    const fees = marketplace.calculate(pricing.salePrice);
    const itemTotalFees = fees.totalFees * item.quantity;
    const itemProfit = itemSalePrice - itemTotalFees - unitCost * item.quantity;

    itemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      salePrice: itemSalePrice,
      unitCost,
      totalFees: itemTotalFees,
      profit: itemProfit,
    });

    saleTotalPrice += itemSalePrice;
    saleTotalCost += unitCost * item.quantity;
    saleTotalFees += itemTotalFees;
  }

  const saleNetRevenue = saleTotalPrice - saleTotalFees;
  const saleProfit = saleNetRevenue - saleTotalCost;

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  // Create sale with items
  const saleCreate = prisma.sale.create({
    data: {
      gateway: data.gateway as any,
      salePrice: saleTotalPrice,
      totalCost: saleTotalCost,
      totalFees: saleTotalFees,
      netRevenue: saleNetRevenue,
      profit: saleProfit,
      customerName: data.customerName,
      customerDocument: data.customerDocument,
      trackingCode: data.trackingCode,
      createdById: userId,
      items: {
        create: itemsData,
      },
    },
    include: { items: true },
  });
  operations.push(saleCreate);

  // Decrement stock for each product
  for (const item of data.items) {
    operations.push(
      prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      })
    );
  }

  const [sale] = await prisma.$transaction(operations);

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "SALE",
    entityId: (sale as any).id,
    newData: sale as unknown as Record<string, unknown>,
  });

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

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "SALE",
    entityId: id,
    oldData: { deliveryStatus: sale.deliveryStatus },
    newData: { deliveryStatus: newStatus },
  });

  return updated;
}

export async function importSalesFromCSV(csvBuffer: Buffer, gateway: string, userId: string) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const results: { success: number; errors: string[] } = { success: 0, errors: [] };

  for (const [i, record] of records.entries()) {
    try {
      const productName = record["produto"] || record["product"] || record["nome"];
      const quantity = Number(record["quantidade"] || record["qty"] || "1");

      if (!productName) {
        results.errors.push(`Linha ${i + 2}: dados incompletos`);
        continue;
      }

      const product = await prisma.product.findFirst({
        where: { name: { contains: productName, mode: "insensitive" } },
      });
      if (!product) {
        results.errors.push(`Linha ${i + 2}: produto "${productName}" não encontrado`);
        continue;
      }

      await createSale({ gateway, items: [{ productId: product.id, quantity }] }, userId);
      results.success++;
    } catch (err) {
      results.errors.push(`Linha ${i + 2}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return results;
}
```

**Step 2: Update dashboard.service.ts**

The dashboard uses `productId` on `Sale` which no longer exists. Update `topProducts` query to use `SaleItem`:

Replace the `topProducts` query in `getDashboardData`:
```typescript
// Old: prisma.sale.groupBy({ by: ["productId"], ... })
// New: use sale_items table
prisma.$queryRaw`
  SELECT si.product_id as "productId", COUNT(*)::int as count, SUM(si.sale_price) as revenue
  FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  WHERE s.created_at >= ${startOfMonth}
  GROUP BY si.product_id
  ORDER BY count DESC
  LIMIT 5
` as Promise<{ productId: string; count: number; revenue: number }[]>,
```

Also update the mapping below to work with the raw query result format.

**Step 3: Build backend to verify**

Run: `cd packages/api && pnpm build`

**Step 4: Commit**

```bash
git add packages/api/src/services/
git commit -m "feat: refactor sale service for multi-item sales"
```

---

## Task 4: Backend — Update Sale Route Validation

**Files:**
- Modify: `packages/api/src/routes/sales.ts`

The route itself doesn't need major changes since it passes `req.body` directly to `createSale`. But verify the request body structure change is compatible. The CSV import route also passes through `createSale` which now expects `{ items: [...] }`.

No code changes needed here — the route already does `saleService.createSale(req.body, req.user!.id)`.

**Step 1: Verify build**

Run: `cd packages/api && pnpm build`

**Step 2: Commit** (if any changes)

---

## Task 5: Frontend Store — Update sale.store.ts

**Files:**
- Modify: `packages/web/src/stores/sale.store.ts`

**Step 1: Update the store types and createSale signature**

```typescript
import { create } from "zustand";
import { api } from "../lib/api.js";
import type { Sale, DeliveryStatus, GatewayId, DeliveryStatusHistoryEntry, CreateSaleItemInput } from "@mimos/shared";

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
    gateway: GatewayId;
    items: CreateSaleItemInput[];
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
      qs.set("page", String(params?.page ?? 1));
      qs.set("limit", "20");
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
```

**Step 2: Commit**

```bash
git add packages/web/src/stores/sale.store.ts
git commit -m "feat: update sale store for multi-item API"
```

---

## Task 6: Frontend — Rewrite SaleFormDialog for Multi-Item

**Files:**
- Modify: `packages/web/src/components/sales/SaleFormDialog.tsx`

**Step 1: Rewrite the dialog**

Key UX changes:
- User selects gateway first (affects all item prices)
- User adds items: pick product from dropdown + quantity (auto-shows calculated price)
- "Adicionar Item" button to add more items
- Summary at the bottom showing total
- No manual price input — prices are auto-calculated via `calcIdealPrice()` in the frontend
- Each item row shows: product name, qty input, unit price (auto), subtotal (auto), remove button

The dialog should use `calcIdealPrice` and `MARKETPLACES` from `@mimos/shared` to show real-time price preview.

```tsx
import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, ShoppingCart } from "lucide-react";
import { GATEWAY_LABELS, MARKETPLACES, calcIdealPrice, formatBRL } from "@mimos/shared";
import type { Product, GatewayId } from "@mimos/shared";
import { api } from "../../lib/api.js";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    gateway: GatewayId;
    items: { productId: string; quantity: number }[];
    customerName?: string;
    customerDocument?: string;
  }) => void;
}

interface ItemRow {
  id: string;
  productId: string;
  quantity: number;
}

const GATEWAY_IDS: GatewayId[] = ["SHOPEE_CNPJ", "SHOPEE_CPF", "ML_CLASSICO", "ML_PREMIUM"];

let nextItemId = 0;

export function SaleFormDialog({ open, onClose, onSubmit }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [gateway, setGateway] = useState<GatewayId>("SHOPEE_CNPJ");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");

  useEffect(() => {
    if (open) {
      setGateway("SHOPEE_CNPJ");
      setItems([{ id: String(++nextItemId), productId: "", quantity: 1 }]);
      setCustomerName("");
      setCustomerDocument("");
      setLoadingProducts(true);
      api
        .get<{ products: Product[]; total: number }>("/products?limit=500")
        .then((data) => setProducts(data.products))
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    }
  }, [open]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const getItemPrice = (productId: string) => {
    const product = productMap.get(productId);
    if (!product) return null;
    const costs = {
      productCost: product.unitPrice,
      packaging: product.packagingCost,
      labor: product.laborCost,
      shipping: product.shippingCost,
      otherCosts: product.otherCosts,
      taxRate: product.taxRate,
    };
    const mp = MARKETPLACES[gateway];
    return calcIdealPrice(costs, product.desiredMargin, mp);
  };

  const totals = useMemo(() => {
    let total = 0;
    let totalProfit = 0;
    for (const item of items) {
      const pricing = getItemPrice(item.productId);
      if (pricing) {
        total += pricing.salePrice * item.quantity;
        totalProfit += pricing.profit * item.quantity;
      }
    }
    return { total, totalProfit };
  }, [items, gateway, productMap]);

  const addItem = () => {
    setItems([...items, { id: String(++nextItemId), productId: "", quantity: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: "productId" | "quantity", value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  if (!open) return null;

  const allItemsValid = items.every((i) => i.productId && i.quantity > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      gateway,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card-bg rounded-2xl border border-stroke shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h2 className="text-[18px] font-bold text-text-dark">Nova Venda</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Gateway */}
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
              Gateway <span className="text-red-400">*</span>
            </label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value as GatewayId)}
              className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              {GATEWAY_IDS.map((gid) => (
                <option key={gid} value={gid}>{GATEWAY_LABELS[gid]}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                Itens <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {loadingProducts ? (
                <div className="h-16 bg-page-bg rounded-lg animate-pulse" />
              ) : (
                items.map((item, index) => {
                  const pricing = getItemPrice(item.productId);
                  const product = productMap.get(item.productId);
                  return (
                    <div key={item.id} className="bg-page-bg rounded-xl p-4 border border-stroke/50 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-start gap-3">
                        {/* Product */}
                        <div className="flex-1">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          >
                            <option value="">Selecione um produto</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (estoque: {p.quantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-20">
                          <input
                            type="number"
                            min={1}
                            max={product?.quantity ?? 999}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                            required
                            className="w-full px-3 py-2 border border-stroke rounded-lg text-[13px] bg-card-bg text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                          className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Price info */}
                      {pricing && (
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-stroke/30">
                          <span className="text-[12px] text-text-muted">
                            Unit: <span className="font-semibold text-text-dark">{formatBRL(pricing.salePrice)}</span>
                          </span>
                          <span className="text-[12px] text-text-muted">
                            Subtotal: <span className="font-semibold text-text-dark">{formatBRL(pricing.salePrice * item.quantity)}</span>
                          </span>
                          <span className={`text-[12px] font-semibold ${pricing.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                            Lucro: {formatBRL(pricing.profit * item.quantity)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Totals Summary */}
          {totals.total > 0 && (
            <div className="bg-sidebar-bg text-white rounded-xl p-4 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-primary" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/60">Total da Venda</p>
                  <p className="text-[20px] font-extrabold">{formatBRL(totals.total)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-white/60">Lucro Estimado</p>
                <p className={`text-[18px] font-bold ${totals.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatBRL(totals.totalProfit)}
                </p>
              </div>
            </div>
          )}

          {/* Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                CPF/CNPJ
              </label>
              <input
                type="text"
                value={customerDocument}
                onChange={(e) => setCustomerDocument(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2.5 border border-stroke rounded-lg text-[14px] bg-page-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stroke rounded-lg text-[14px] font-medium text-text-secondary hover:bg-page-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!allItemsValid}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[14px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/components/sales/SaleFormDialog.tsx
git commit -m "feat: rewrite SaleFormDialog for multi-item with auto-pricing"
```

---

## Task 7: Frontend — Update Sales Page and SaleDetailDrawer

**Files:**
- Modify: `packages/web/src/pages/Sales.tsx`
- Modify: `packages/web/src/components/sales/SaleDetailDrawer.tsx`

**Step 1: Update Sales.tsx table**

The table currently shows `sale.productName` (single product). Change to show item count or first product name + "e mais N". The `salePrice` column now shows the sale total.

Key changes in the table row:
```tsx
{/* Product column — show items summary */}
<td className="px-4 py-3">
  <p className="text-[14px] font-semibold text-text-dark">
    {sale.items.length === 1
      ? sale.items[0].productName
      : `${sale.items[0].productName} +${sale.items.length - 1}`}
  </p>
  {sale.customerName && (
    <p className="text-[11px] text-text-muted">{sale.customerName}</p>
  )}
</td>
{/* Qty column — total items */}
<td className="text-center px-3 py-3 text-[13px] font-semibold text-text-dark">
  {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
</td>
```

Also update the `handleCreateSale` to match the new `createSale` signature.

**Step 2: Update SaleDetailDrawer.tsx**

Replace the single product info block with a list of items:
- Show each item: product name, qty, unit price, subtotal, profit
- Keep the totals section for the sale overall
- Keep status update and timeline as-is

**Step 3: Build to verify**

Run: `cd packages/web && pnpm build`

**Step 4: Commit**

```bash
git add packages/web/src/pages/Sales.tsx packages/web/src/components/sales/SaleDetailDrawer.tsx
git commit -m "feat: update Sales page and drawer for multi-item display"
```

---

## Task 8: CSS Animations — Add Keyframes to styles.css

**Files:**
- Modify: `packages/web/src/styles.css`

**Step 1: Add animation keyframes and utilities**

Tailwind v4 uses `@theme` for custom values and `@utility` for custom classes. Add after the existing `@theme` block:

```css
@theme {
  /* ... existing values ... */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-fade-in-up: fade-in-up 0.3s ease-out both;
  --animate-fade-in-down: fade-in-down 0.3s ease-out both;
  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;
  --animate-slide-in-left: slide-in-left 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

**Step 2: Commit**

```bash
git add packages/web/src/styles.css
git commit -m "feat: add animation keyframes for app-wide transitions"
```

---

## Task 9: Apply Animations Across All Pages

**Files:**
- Modify: `packages/web/src/pages/Dashboard.tsx`
- Modify: `packages/web/src/pages/Products.tsx`
- Modify: `packages/web/src/pages/Sales.tsx`
- Modify: `packages/web/src/pages/Users.tsx`
- Modify: `packages/web/src/pages/AuditLogs.tsx`
- Modify: `packages/web/src/pages/Login.tsx`
- Modify: `packages/web/src/components/layout/Sidebar.tsx`
- Modify: All modal/dialog components

**Animation targets:**

| Element | Animation |
|---------|-----------|
| Page content wrappers (`<main>`) | `animate-fade-in` |
| Stat cards (Dashboard) | `animate-fade-in-up` with staggered delay (`style={{ animationDelay: '100ms' }}`) |
| Table rows (Products, Sales, Users, AuditLogs) | `animate-fade-in-up` with staggered delay per row |
| Modal dialogs (all) | `animate-scale-in` on the dialog panel |
| Drawer (SaleDetail) | already has `animate-in slide-in-from-right` — keep it |
| Cards in Dashboard charts | `animate-fade-in-up` with delay |
| Empty states | `animate-fade-in` |
| Sidebar nav items | `animate-slide-in-left` with stagger on mount |
| Login form | `animate-scale-in` |
| Pagination controls | `animate-fade-in` |
| Filter bars | `animate-fade-in-down` |

**Apply pattern for table rows:**
```tsx
{items.map((item, index) => (
  <tr
    key={item.id}
    className="... animate-fade-in-up"
    style={{ animationDelay: `${index * 30}ms` }}
  >
```

**Apply pattern for stat cards:**
```tsx
{STAT_CARDS.map((card, index) => (
  <div
    key={card.key}
    className="... animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
  >
```

**Apply pattern for modals:**
```tsx
<div className="bg-card-bg rounded-2xl ... animate-scale-in">
```

**Step 1: Apply animations to all pages**

Go through each file listed above and add the appropriate animation classes. Keep it subtle — 200-300ms durations, ease-out, small translations.

**Step 2: Build to verify**

Run: `cd packages/web && pnpm build`

**Step 3: Commit**

```bash
git add packages/web/src/
git commit -m "feat: add animations across all pages and components"
```

---

## Task 10: Final Build Verification

**Step 1: Full build**

Run: `pnpm build`

**Step 2: Verify no TypeScript errors**

Run: `cd packages/web && npx tsc --noEmit`

**Step 3: Commit all remaining changes**

```bash
git add .
git commit -m "feat: multi-item sales with auto-pricing and app-wide animations"
```
