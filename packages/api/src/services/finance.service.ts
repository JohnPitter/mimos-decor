import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import { logger } from "../lib/logger.js";
import type { Prisma } from "@prisma/client";
import crypto from "crypto";

// Helper: auto-update PENDING -> OVERDUE for past due dates
async function markOverdueEntries() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  await prisma.financeEntry.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}

export async function listEntries(params: {
  search?: string;
  type?: string;
  status?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  await markOverdueEntries();
  const { search, type, status, categoryId, startDate, endDate, page = 1, limit = 20 } = params;

  const where: Prisma.FinanceEntryWhereInput = {};
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (type) where.type = type as Prisma.EnumFinanceTypeFilter["equals"];
  if (status) where.status = status as Prisma.EnumFinanceStatusFilter["equals"];
  if (categoryId) where.categoryId = categoryId;
  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) where.dueDate.gte = new Date(startDate);
    if (endDate) where.dueDate.lte = new Date(endDate);
  }

  const [entries, total] = await Promise.all([
    prisma.financeEntry.findMany({
      where,
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dueDate: "asc" },
    }),
    prisma.financeEntry.count({ where }),
  ]);

  return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSummary() {
  await markOverdueEntries();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [payable, receivable, overdue, paidThisMonth] = await Promise.all([
    prisma.financeEntry.aggregate({
      where: { type: "PAYABLE", status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: { type: "RECEIVABLE", status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.financeEntry.aggregate({
      where: { status: "OVERDUE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financeEntry.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalPayable: payable._sum.amount ?? 0,
    totalReceivable: receivable._sum.amount ?? 0,
    overdueCount: overdue._count ?? 0,
    overdueAmount: overdue._sum.amount ?? 0,
    paidThisMonth: paidThisMonth._sum.amount ?? 0,
  };
}

export async function getNotifications() {
  await markOverdueEntries();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59);

  const [overdueCount, dueToday, dueTomorrow] = await Promise.all([
    prisma.financeEntry.count({ where: { status: "OVERDUE" } }),
    prisma.financeEntry.count({ where: { status: "PENDING", dueDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.financeEntry.count({ where: { status: "PENDING", dueDate: { gte: tomorrowStart, lte: tomorrowEnd } } }),
  ]);

  return { overdue: overdueCount, dueToday, dueTomorrow, total: overdueCount + dueToday };
}

export async function createEntry(data: {
  type: string;
  title: string;
  description?: string;
  amount: number;
  categoryId: string;
  dueDate: string;
  isRecurring?: boolean;
  recurringMonths?: number;
}, userId: string) {
  if (data.isRecurring && data.recurringMonths && data.recurringMonths > 1) {
    const groupId = crypto.randomUUID();
    const entries = [];
    for (let i = 0; i < data.recurringMonths; i++) {
      const dueDate = new Date(data.dueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      entries.push({
        type: data.type as "PAYABLE" | "RECEIVABLE",
        title: data.title,
        description: data.description ?? null,
        amount: data.amount,
        categoryId: data.categoryId,
        dueDate,
        isRecurring: true,
        recurringMonths: data.recurringMonths,
        recurringGroupId: groupId,
        installmentNumber: i + 1,
        createdById: userId,
      });
    }
    const result = await prisma.financeEntry.createMany({ data: entries });
    const created = await prisma.financeEntry.findMany({
      where: { recurringGroupId: groupId },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    });
    logger.info(`Created ${result.count} recurring finance entries`, "finance");
    return created;
  } else {
    const entry = await prisma.financeEntry.create({
      data: {
        type: data.type as "PAYABLE" | "RECEIVABLE",
        title: data.title,
        description: data.description ?? null,
        amount: data.amount,
        categoryId: data.categoryId,
        dueDate: new Date(data.dueDate),
        createdById: userId,
      },
      include: { category: true },
    });
    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "FINANCE_ENTRY",
      entityId: entry.id,
      newData: entry as unknown as Record<string, unknown>,
    });
    logger.info(`Finance entry created: ${entry.title}`, "finance");
    return entry;
  }
}

export async function updateEntry(id: string, data: {
  title?: string;
  description?: string;
  amount?: number;
  categoryId?: string;
  dueDate?: string;
}, userId: string) {
  const old = await prisma.financeEntry.findUnique({ where: { id } });
  if (!old) return null;

  const updateData: Prisma.FinanceEntryUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
  if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);

  const entry = await prisma.financeEntry.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "FINANCE_ENTRY",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: entry as unknown as Record<string, unknown>,
  });
  logger.info(`Finance entry updated: ${entry.title}`, "finance");
  return entry;
}

export async function deleteEntry(id: string, userId: string) {
  const old = await prisma.financeEntry.findUnique({ where: { id } });
  if (!old) return null;
  await prisma.financeEntry.delete({ where: { id } });
  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "FINANCE_ENTRY",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });
  logger.info(`Finance entry deleted: ${old.title}`, "finance");
  return old;
}

export async function deleteRecurringGroup(groupId: string, userId: string) {
  const entries = await prisma.financeEntry.findMany({ where: { recurringGroupId: groupId } });
  if (entries.length === 0) return null;
  await prisma.financeEntry.deleteMany({ where: { recurringGroupId: groupId } });
  logger.info(`Deleted ${entries.length} recurring entries (group: ${groupId}) by user ${userId}`, "finance");
  return entries;
}

export async function payEntry(id: string, userId: string) {
  const old = await prisma.financeEntry.findUnique({ where: { id } });
  if (!old) return null;
  const entry = await prisma.financeEntry.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
    include: { category: true },
  });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "FINANCE_ENTRY",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: entry as unknown as Record<string, unknown>,
  });
  logger.info(`Finance entry paid: ${entry.title}`, "finance");
  return entry;
}

// Category CRUD
export async function listCategories() {
  return prisma.financeCategory.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(data: {
  name: string;
  type: string;
  color: string;
  icon: string;
}, userId: string) {
  const category = await prisma.financeCategory.create({
    data: {
      name: data.name,
      type: data.type as "PAYABLE" | "RECEIVABLE",
      color: data.color,
      icon: data.icon,
    },
  });
  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "FINANCE_CATEGORY",
    entityId: category.id,
    newData: category as unknown as Record<string, unknown>,
  });
  logger.info(`Finance category created: ${category.name}`, "finance");
  return category;
}

export async function updateCategory(id: string, data: {
  name?: string;
  color?: string;
  icon?: string;
}, userId: string) {
  const old = await prisma.financeCategory.findUnique({ where: { id } });
  if (!old) return null;
  const category = await prisma.financeCategory.update({ where: { id }, data });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "FINANCE_CATEGORY",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: category as unknown as Record<string, unknown>,
  });
  return category;
}

export async function deleteCategory(id: string, userId: string) {
  const old = await prisma.financeCategory.findUnique({ where: { id } });
  if (!old) return null;
  const count = await prisma.financeEntry.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error("CATEGORY_HAS_ENTRIES");
  }
  await prisma.financeCategory.delete({ where: { id } });
  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "FINANCE_CATEGORY",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });
  logger.info(`Finance category deleted: ${old.name}`, "finance");
  return old;
}

export async function seedDefaultCategories() {
  const count = await prisma.financeCategory.count({ where: { isDefault: true } });
  if (count > 0) return;

  const defaults = [
    { name: "Fornecedores", type: "PAYABLE" as const, color: "#EF4444", icon: "Truck" },
    { name: "Aluguel", type: "PAYABLE" as const, color: "#F59E0B", icon: "Home" },
    { name: "Energia", type: "PAYABLE" as const, color: "#F97316", icon: "Zap" },
    { name: "Internet", type: "PAYABLE" as const, color: "#3B82F6", icon: "Wifi" },
    { name: "Material", type: "PAYABLE" as const, color: "#8B5CF6", icon: "Package" },
    { name: "Frete", type: "PAYABLE" as const, color: "#EC4899", icon: "Send" },
    { name: "Impostos", type: "PAYABLE" as const, color: "#DC2626", icon: "Receipt" },
    { name: "Outros (Despesas)", type: "PAYABLE" as const, color: "#6B7280", icon: "MoreHorizontal" },
    { name: "Vendas", type: "RECEIVABLE" as const, color: "#10B981", icon: "ShoppingCart" },
    { name: "Serviços", type: "RECEIVABLE" as const, color: "#06B6D4", icon: "Briefcase" },
    { name: "Outros (Receitas)", type: "RECEIVABLE" as const, color: "#6B7280", icon: "MoreHorizontal" },
  ];

  await prisma.financeCategory.createMany({
    data: defaults.map(d => ({ ...d, isDefault: true })),
  });
  logger.info("Seeded default finance categories", "finance");
}
