import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { MARKETPLACES, buildMarketplace, calcProductCost, calcIdealPrice } from "@mimos/shared";
import type { Marketplace, CommissionTier, PixTier } from "@mimos/shared";
import type { Prisma, DeliveryStatus } from "@prisma/client";
import { parse } from "csv-parse/sync";

async function resolveMarketplace(gateway: string): Promise<Marketplace> {
  const builtin = MARKETPLACES[gateway];
  if (builtin) return builtin;

  const custom = await prisma.customGateway.findUnique({ where: { slug: gateway } });
  if (!custom) throw new Error("Gateway inválido");

  return buildMarketplace(custom.slug, custom.name, {
    tiers: deserializeTiers(custom.tiers as unknown as unknown[]),
    pixTiers: custom.pixTiers as unknown as PixTier[],
    extraFixed: custom.extraFixed,
  });
}

function deserializeTiers(raw: unknown[]): CommissionTier[] {
  return (raw as { maxPrice: number; pct: number; fixed: number }[]).map((t) => ({
    maxPrice: t.maxPrice >= 999999999 ? Infinity : t.maxPrice,
    pct: t.pct,
    fixed: t.fixed,
  }));
}

const SALE_ITEMS_INCLUDE = {
  items: {
    include: { product: { select: { name: true } } },
  },
} as const;

function mapSaleItems(sale: { items: { product: { name: string } | null; [k: string]: unknown }[]; [k: string]: unknown }) {
  return {
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      productName: item.product?.name ?? "Produto removido",
      product: undefined,
    })),
  };
}

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
  if (gateway) where.gateway = gateway;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: SALE_ITEMS_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  const mapped = sales.map(mapSaleItems);
  return { sales: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      ...SALE_ITEMS_INCLUDE,
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });
  if (!sale) return null;
  return {
    ...mapSaleItems(sale),
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
  const marketplace = await resolveMarketplace(data.gateway);
  if (!data.items.length) throw new Error("A venda deve ter pelo menos um item");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const saleItems: {
    productId: string;
    quantity: number;
    salePrice: number;
    unitCost: number;
    totalFees: number;
    profit: number;
  }[] = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Produto ${item.productId} nao encontrado`);
    if (product.quantity < item.quantity) {
      throw new Error(`Estoque insuficiente para "${product.name}" (disponivel: ${product.quantity}, solicitado: ${item.quantity})`);
    }

    const costs = {
      productCost: product.unitPrice,
      packaging: product.packagingCost,
      labor: product.laborCost,
      shipping: product.shippingCost,
      otherCosts: product.otherCosts,
      taxRate: product.taxRate,
    };

    const pricing = calcIdealPrice(costs, product.desiredMargin, marketplace);
    const fees = marketplace.calculate(pricing.salePrice);
    const { total: unitCost } = calcProductCost(costs);
    const itemTotalFees = fees.totalFees * item.quantity;
    const itemNetRevenue = pricing.salePrice * item.quantity - itemTotalFees;
    const itemProfit = itemNetRevenue - unitCost * item.quantity;

    saleItems.push({
      productId: item.productId,
      quantity: item.quantity,
      salePrice: pricing.salePrice,
      unitCost,
      totalFees: itemTotalFees,
      profit: itemProfit,
    });
  }

  const totalSalePrice = saleItems.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const totalCost = saleItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const totalFees = saleItems.reduce((sum, i) => sum + i.totalFees, 0);
  const netRevenue = totalSalePrice - totalFees;
  const profit = saleItems.reduce((sum, i) => sum + i.profit, 0);

  const stockDecrements = data.items.map((item) =>
    prisma.product.update({
      where: { id: item.productId },
      data: { quantity: { decrement: item.quantity } },
    }),
  );

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        gateway: data.gateway,
        salePrice: totalSalePrice,
        totalCost,
        totalFees,
        netRevenue,
        profit,
        customerName: data.customerName,
        customerDocument: data.customerDocument,
        trackingCode: data.trackingCode,
        createdById: userId,
        items: {
          create: saleItems,
        },
      },
    }),
    ...stockDecrements,
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

      if (!productName) {
        results.errors.push(`Linha ${i + 2}: dados incompletos`);
        continue;
      }

      const product = await prisma.product.findFirst({ where: { name: { contains: productName, mode: "insensitive" } } });
      if (!product) {
        results.errors.push(`Linha ${i + 2}: produto "${productName}" nao encontrado`);
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
