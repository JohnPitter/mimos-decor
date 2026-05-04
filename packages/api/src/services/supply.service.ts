import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { logger } from "../lib/logger.js";
import { getCached, setCached } from "../lib/idempotency.js";
import type { Prisma } from "@prisma/client";

export async function listSupplies(params: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 20 } = params;
  const where: Prisma.SupplyWhereInput = {};
  if (search) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { supplier: { contains: q, mode: "insensitive" } },
    ];
  }
  // lowStock filter is handled client-side for now

  const [supplies, total] = await Promise.all([
    prisma.supply.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" } }),
    prisma.supply.count({ where }),
  ]);

  return { supplies, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createSupply(data: {
  name: string;
  description?: string;
  unitPrice: number;
  quantity?: number;
  unit?: string;
  supplier?: string;
  minStock?: number;
}, idempotencyKey?: string) {
  if (idempotencyKey) {
    const cached = getCached<Awaited<ReturnType<typeof prisma.supply.create>>>("supply", idempotencyKey);
    if (cached) return cached;
  }
  const supply = await prisma.supply.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() ?? null,
      unitPrice: data.unitPrice,
      quantity: data.quantity ?? 0,
      unit: data.unit?.trim() ?? "un",
      supplier: data.supplier?.trim() ?? null,
      minStock: data.minStock ?? 0,
    },
  });
  logger.info(`Supply created: ${supply.name}`, "supply");
  if (idempotencyKey) setCached("supply", idempotencyKey, supply);
  return supply;
}

export async function updateSupply(id: string, data: {
  name?: string;
  description?: string;
  unitPrice?: number;
  quantity?: number;
  unit?: string;
  supplier?: string;
  minStock?: number;
}) {
  const old = await prisma.supply.findUnique({ where: { id } });
  if (!old) return null;
  const trimmed: typeof data = { ...data };
  if (trimmed.name) trimmed.name = trimmed.name.trim();
  if (trimmed.description) trimmed.description = trimmed.description.trim();
  if (trimmed.unit) trimmed.unit = trimmed.unit.trim();
  if (trimmed.supplier) trimmed.supplier = trimmed.supplier.trim();
  const supply = await prisma.supply.update({ where: { id }, data: trimmed });
  logger.info(`Supply updated: ${supply.name}`, "supply");
  return supply;
}

export async function deleteSupply(id: string) {
  const old = await prisma.supply.findUnique({ where: { id } });
  if (!old) return null;
  await prisma.supply.delete({ where: { id } });
  logger.info(`Supply deleted: ${old.name}`, "supply");
  return old;
}

export async function registerPurchase(data: {
  supplyId: string;
  quantity: number;
  totalCost: number;
  supplier?: string;
  note?: string;
  dueDate: string;
}, userId: string, idempotencyKey?: string) {
  if (idempotencyKey) {
    const cached = getCached<Awaited<ReturnType<typeof prisma.supplyPurchase.create>>>(userId, idempotencyKey);
    if (cached) return cached;
  }
  const result = await prisma.$transaction(async (tx) => {
    const supply = await tx.supply.findUnique({ where: { id: data.supplyId } });
    if (!supply) throw new Error("SUPPLY_NOT_FOUND");

    const category = await tx.financeCategory.findFirst({
      where: { name: "Fornecedores", type: "PAYABLE" },
    });
    if (!category) throw new Error("CATEGORY_NOT_FOUND");

    const purchase = await tx.supplyPurchase.create({
      data: {
        supplyId: data.supplyId,
        quantity: data.quantity,
        totalCost: data.totalCost,
        supplier: data.supplier?.trim() ?? supply.supplier ?? null,
        note: data.note?.trim() ?? null,
      },
    });

    await tx.supply.update({
      where: { id: data.supplyId },
      data: { quantity: { increment: data.quantity } },
    });

    const financeEntry = await tx.financeEntry.create({
      data: {
        type: "PAYABLE",
        title: `Compra: ${supply.name}`,
        description: data.note ?? null,
        amount: data.totalCost,
        categoryId: category.id,
        dueDate: new Date(data.dueDate),
        createdById: userId,
      },
    });

    return { purchase, financeEntry, supplyName: supply.name };
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "FINANCE_ENTRY",
    entityId: result.financeEntry.id,
    newData: result.financeEntry as unknown as Record<string, unknown>,
  });

  logger.info(`Supply purchase registered: ${result.supplyName} x${data.quantity}`, "supply");
  if (idempotencyKey) setCached(userId, idempotencyKey, result.purchase);
  return result.purchase;
}
