import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { logger } from "../lib/logger.js";
import { getConfiguredTimezone, getStartOfMonthUTC, getEndOfMonthUTC } from "../lib/timezone.js";
import { MARKETPLACES, buildMarketplace, calcProductCost, calcIdealPrice } from "@mimos/shared";
import type { Marketplace, CommissionTier, PixTier } from "@mimos/shared";
import type { Prisma, DeliveryStatus } from "@prisma/client";
import { parse } from "csv-parse/sync";

async function resolveMarketplace(gateway: string): Promise<Marketplace> {
  if (gateway === "PRESENCIAL") {
    return buildMarketplace("PRESENCIAL", "Presencial", {
      tiers: [{ maxPrice: Infinity, pct: 0, fixed: 0 }],
      pixTiers: [],
      extraFixed: 0,
    });
  }

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

function mapSaleItems(sale: { items: { product: { name: string } | null; productName: string; [k: string]: unknown }[]; [k: string]: unknown }) {
  return {
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      productName: item.product?.name ?? item.productName,
      product: undefined,
    })),
  };
}

export async function listSales(params: {
  search?: string;
  status?: DeliveryStatus;
  excludeStatus?: DeliveryStatus;
  gateway?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { search, status, excludeStatus, gateway, startDate, endDate, page = 1, limit = 50 } = params;
  const where: Prisma.SaleWhereInput = {};
  if (search) {
    where.OR = [
      { shopeeUsername: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.deliveryStatus = status;
  else if (excludeStatus) where.deliveryStatus = { not: excludeStatus };
  if (gateway) where.gateway = gateway;
  if (startDate || endDate) {
    where.saleDate = {};
    if (startDate) where.saleDate.gte = new Date(startDate);
    if (endDate) where.saleDate.lte = new Date(endDate);
  } else if (!status) {
    const tz = await getConfiguredTimezone();
    const monthRange = { saleDate: { gte: getStartOfMonthUTC(tz), lte: getEndOfMonthUTC(tz) } };
    const alwaysVisible: DeliveryStatus[] = ["PREPARING", "IN_TRANSIT"];
    const statusFilter = where.deliveryStatus;
    delete where.deliveryStatus;
    where.AND = [
      { OR: [
        { ...monthRange, ...(statusFilter ? { deliveryStatus: statusFilter } : {}) },
        { deliveryStatus: { in: alwaysVisible } },
      ] },
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: SALE_ITEMS_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { saleDate: "desc" },
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
  customerState?: string;
  customerGender?: string;
  shopeeUsername?: string;
  trackingCode?: string;
  deliveryStatus?: DeliveryStatus;
  discount?: number;
  saleDate?: string;
  overrideSalePrice?: number;
  overrideShipping?: number;
  overrideFees?: number;
}, userId: string) {
  const marketplace = await resolveMarketplace(data.gateway);
  if (!data.items.length) throw new Error("A venda deve ter pelo menos um item");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const saleItems: {
    productId: string;
    productName: string;
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
      productName: product.name,
      quantity: item.quantity,
      salePrice: pricing.salePrice,
      unitCost,
      totalFees: itemTotalFees,
      profit: itemProfit,
    });
  }

  const discount = data.discount ?? 0;
  const calcSalePrice = saleItems.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const totalCost = saleItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const calcFees = saleItems.reduce((sum, i) => sum + i.totalFees, 0);
  const totalSalePrice = data.overrideSalePrice ?? calcSalePrice;
  const totalFees = data.overrideFees ?? calcFees;
  const netRevenue = totalSalePrice - totalFees - discount;
  const profit = netRevenue - totalCost;

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
        discount,
        saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
        customerName: data.customerName,
        customerDocument: data.customerDocument,
        customerState: data.customerState,
        customerGender: data.customerGender,
        shopeeUsername: data.shopeeUsername,
        trackingCode: data.trackingCode,
        deliveryStatus: data.deliveryStatus ?? "PENDING",
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

export async function deleteSale(id: string, userId: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) return null;

  // Restore stock for each item
  const stockIncrements = sale.items.map((item) =>
    prisma.product.update({
      where: { id: item.productId! },
      data: { quantity: { increment: item.quantity } },
    }),
  );

  await prisma.$transaction([
    prisma.deliveryStatusHistory.deleteMany({ where: { saleId: id } }),
    prisma.saleItem.deleteMany({ where: { saleId: id } }),
    prisma.sale.delete({ where: { id } }),
    ...stockIncrements.filter((_, i) => sale.items[i].productId !== null),
  ]);

  await createAuditLog({ userId, action: "DELETE", entity: "SALE", entityId: id, oldData: sale as unknown as Record<string, unknown> });
  logger.info(`Sale deleted: ${id}`, "sale");
  return sale;
}

export async function updateSale(id: string, data: {
  salePrice?: number;
  totalCost?: number;
  totalFees?: number;
  discount?: number;
  customerName?: string;
  customerDocument?: string;
  customerState?: string;
  customerGender?: string;
  shopeeUsername?: string;
  trackingCode?: string;
  gateway?: string;
  saleDate?: string;
}, userId: string) {
  const old = await prisma.sale.findUnique({ where: { id } });
  if (!old) return null;

  const updateData: Record<string, unknown> = {};
  const newSalePrice = data.salePrice ?? old.salePrice;
  const newTotalFees = data.totalFees ?? old.totalFees;
  const newDiscount = data.discount ?? old.discount;
  const newTotalCost = data.totalCost ?? old.totalCost;
  const newNetRevenue = newSalePrice - newTotalFees - newDiscount;
  const newProfit = newNetRevenue - newTotalCost;

  if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
  if (data.totalCost !== undefined) updateData.totalCost = data.totalCost;
  if (data.totalFees !== undefined) updateData.totalFees = data.totalFees;
  if (data.discount !== undefined) updateData.discount = data.discount;
  updateData.netRevenue = newNetRevenue;
  updateData.profit = newProfit;
  if (data.customerName !== undefined) updateData.customerName = data.customerName || null;
  if (data.customerDocument !== undefined) updateData.customerDocument = data.customerDocument || null;
  if (data.customerState !== undefined) updateData.customerState = data.customerState || null;
  if (data.customerGender !== undefined) updateData.customerGender = data.customerGender || null;
  if (data.shopeeUsername !== undefined) updateData.shopeeUsername = data.shopeeUsername || null;
  if (data.trackingCode !== undefined) updateData.trackingCode = data.trackingCode || null;
  if (data.gateway !== undefined) updateData.gateway = data.gateway;
  if (data.saleDate !== undefined) updateData.saleDate = new Date(data.saleDate);

  const sale = await prisma.sale.update({ where: { id }, data: updateData });
  await createAuditLog({ userId, action: "UPDATE", entity: "SALE", entityId: id, oldData: old as unknown as Record<string, unknown>, newData: sale as unknown as Record<string, unknown> });
  logger.info(`Sale updated: ${id}`, "sale");
  return sale;
}

export async function updateSaleStatus(id: string, newStatus: DeliveryStatus, userId: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) return null;

  const wasCancelled = sale.deliveryStatus === "CANCELLED";
  const isCancelling = newStatus === "CANCELLED";

  const stockDirection = isCancelling && !wasCancelled ? "increment"
    : wasCancelled && !isCancelling ? "decrement"
    : null;

  const stockOps = stockDirection
    ? sale.items.filter(i => i.productId).map(item =>
        prisma.product.update({ where: { id: item.productId! }, data: { quantity: { [stockDirection]: item.quantity } } })
      )
    : [];

  const [updated] = await prisma.$transaction([
    prisma.sale.update({ where: { id }, data: { deliveryStatus: newStatus } }),
    prisma.deliveryStatusHistory.create({
      data: { saleId: id, fromStatus: sale.deliveryStatus, toStatus: newStatus, changedById: userId },
    }),
    ...stockOps,
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
