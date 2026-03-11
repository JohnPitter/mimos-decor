import { prisma } from "../lib/prisma.js";
import { BUILT_IN_GATEWAYS } from "@mimos/shared";
import type { BuiltInGatewayId } from "@mimos/shared";

export async function listGateways() {
  return prisma.customGateway.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getGateway(id: string) {
  return prisma.customGateway.findUnique({ where: { id } });
}

export async function createGateway(data: {
  slug: string;
  name: string;
  color?: string;
  baseGateway: string;
}) {
  if (!BUILT_IN_GATEWAYS.includes(data.baseGateway as BuiltInGatewayId)) {
    throw new Error("Gateway base inválido");
  }

  const slugRegex = /^[A-Z0-9_]+$/;
  if (!slugRegex.test(data.slug)) {
    throw new Error("Slug deve conter apenas letras maiúsculas, números e underscores");
  }

  if (BUILT_IN_GATEWAYS.includes(data.slug as BuiltInGatewayId)) {
    throw new Error("Slug não pode ser igual a um gateway padrão");
  }

  const existing = await prisma.customGateway.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new Error("Já existe um gateway com esse slug");
  }

  return prisma.customGateway.create({
    data: {
      slug: data.slug,
      name: data.name,
      color: data.color ?? "#6B5E5E",
      baseGateway: data.baseGateway,
    },
  });
}

export async function updateGateway(id: string, data: {
  name?: string;
  color?: string;
  baseGateway?: string;
}) {
  const existing = await prisma.customGateway.findUnique({ where: { id } });
  if (!existing) return null;

  if (data.baseGateway && !BUILT_IN_GATEWAYS.includes(data.baseGateway as BuiltInGatewayId)) {
    throw new Error("Gateway base inválido");
  }

  return prisma.customGateway.update({ where: { id }, data });
}

export async function deleteGateway(id: string) {
  const existing = await prisma.customGateway.findUnique({ where: { id } });
  if (!existing) return null;

  const salesCount = await prisma.sale.count({ where: { gateway: existing.slug } });
  if (salesCount > 0) {
    throw new Error(`Não é possível remover: ${salesCount} venda(s) usam este gateway`);
  }

  return prisma.customGateway.delete({ where: { id } });
}
