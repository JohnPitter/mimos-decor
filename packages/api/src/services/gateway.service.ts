import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { BUILT_IN_GATEWAYS, BUILT_IN_PARAMS } from "@mimos/shared";
import type { BuiltInGatewayId, CommissionTier, PixTier } from "@mimos/shared";

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
  tiers?: CommissionTier[];
  pixTiers?: PixTier[];
  extraFixed?: number;
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

  const baseParams = BUILT_IN_PARAMS[data.baseGateway];

  return prisma.customGateway.create({
    data: {
      slug: data.slug,
      name: data.name,
      color: data.color ?? "#6B5E5E",
      baseGateway: data.baseGateway,
      tiers: serializeTiers(data.tiers ?? baseParams.tiers) as unknown as Prisma.InputJsonValue,
      pixTiers: (data.pixTiers ?? baseParams.pixTiers) as unknown as Prisma.InputJsonValue,
      extraFixed: data.extraFixed ?? baseParams.extraFixed,
    },
  });
}

export async function updateGateway(id: string, data: {
  name?: string;
  color?: string;
  tiers?: CommissionTier[];
  pixTiers?: PixTier[];
  extraFixed?: number;
}) {
  const existing = await prisma.customGateway.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.tiers !== undefined) updateData.tiers = serializeTiers(data.tiers) as unknown as Prisma.InputJsonValue;
  if (data.pixTiers !== undefined) updateData.pixTiers = data.pixTiers as unknown as Prisma.InputJsonValue;
  if (data.extraFixed !== undefined) updateData.extraFixed = data.extraFixed;

  return prisma.customGateway.update({ where: { id }, data: updateData });
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

function serializeTiers(tiers: CommissionTier[]): unknown[] {
  return tiers.map((t) => ({
    maxPrice: t.maxPrice === Infinity ? 999999999 : t.maxPrice,
    pct: t.pct,
    fixed: t.fixed,
  }));
}
