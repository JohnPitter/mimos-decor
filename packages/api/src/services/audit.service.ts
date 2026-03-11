import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export async function listAuditLogs(params: {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, action, entity, startDate, endDate, page = 1, limit = 50 } = params;
  const where: Prisma.AuditLogWhereInput = {};
  if (userId) where.userId = userId;
  if (action) where.action = action as any;
  if (entity) where.entity = entity as any;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const mapped = logs.map((l) => ({ ...l, userName: l.user.name, user: undefined }));
  return { logs: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
}
