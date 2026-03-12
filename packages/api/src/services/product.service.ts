import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import type { Prisma } from "@prisma/client";

export async function listProducts(params: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 50 } = params;
  const where: Prisma.ProductWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { supplier: { contains: search, mode: "insensitive" } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { quantity: "asc" } }),
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
