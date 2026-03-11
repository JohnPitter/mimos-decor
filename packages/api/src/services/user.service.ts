import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import bcrypt from "bcryptjs";

const USER_SELECT = { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true };

export async function listUsers(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ select: USER_SELECT, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createUser(data: { name: string; email: string; password: string; role: string }, adminId: string) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("Email já cadastrado");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashedPassword, role: data.role as any },
    select: USER_SELECT,
  });
  await createAuditLog({ userId: adminId, action: "CREATE", entity: "USER", entityId: user.id, newData: { name: user.name, email: user.email, role: user.role } });
  return user;
}

export async function updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }, adminId: string) {
  const old = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!old) return null;
  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({ where: { id }, data: updateData, select: USER_SELECT });
  await createAuditLog({ userId: adminId, action: "UPDATE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown>, newData: user as unknown as Record<string, unknown> });
  return user;
}

export async function deleteUser(id: string, adminId: string) {
  if (id === adminId) throw new Error("Não é possível deletar a si mesmo");
  const old = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!old) return null;
  await prisma.user.delete({ where: { id } });
  await createAuditLog({ userId: adminId, action: "DELETE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown> });
  return old;
}
