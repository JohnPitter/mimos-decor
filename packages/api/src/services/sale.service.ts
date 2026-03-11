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
