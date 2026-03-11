import { Prisma } from "@prisma/client";
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
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: (params.oldData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newData: (params.newData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    logger.debug(`Audit: ${params.action} ${params.entity} ${params.entityId}`, "audit");
  } catch (err) {
    logger.error("Failed to create audit log", "audit", { error: String(err) });
  }
}
