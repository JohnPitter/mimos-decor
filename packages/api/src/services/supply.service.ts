import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { Prisma } from "@prisma/client";

export async function listSupplies(params: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 20 } = params;
  const where: Prisma.SupplyWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { supplier: { contains: search, mode: "insensitive" } },
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
}) {
  const supply = await prisma.supply.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      unitPrice: data.unitPrice,
      quantity: data.quantity ?? 0,
      unit: data.unit ?? "un",
      supplier: data.supplier ?? null,
      minStock: data.minStock ?? 0,
    },
  });
  logger.info(`Supply created: ${supply.name}`, "supply");
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
  const supply = await prisma.supply.update({ where: { id }, data });
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
