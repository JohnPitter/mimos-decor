import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../middleware/audit.js";
import bcrypt from "bcryptjs";

const USER_INCLUDE = {
  role: { select: { id: true, name: true, permissions: true, createdAt: true, updatedAt: true } },
};

const USER_OMIT = { password: true as const };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildUserResponse(user: any) {
  const rolePerms: string[] = user.role?.permissions ?? [];
  const overrides: string[] = user.permissionOverrides ?? [];
  const permissions = [...new Set([...rolePerms, ...overrides])];
  const { password: _, ...rest } = user;
  return { ...rest, permissions };
}

export async function listUsers(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = params;
  const [users, total] = await Promise.all([
    prisma.user.findMany({ omit: USER_OMIT, include: USER_INCLUDE, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.user.count(),
  ]);
  return { users: users.map(buildUserResponse), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createUser(
  data: { name: string; email: string; password: string; isAdmin?: boolean; roleId?: string; permissionOverrides?: string[] },
  adminId: string,
) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("Email já cadastrado");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      isAdmin: data.isAdmin ?? false,
      roleId: data.roleId ?? null,
      permissionOverrides: data.permissionOverrides ?? [],
    },
    omit: USER_OMIT,
    include: USER_INCLUDE,
  });
  await createAuditLog({ userId: adminId, action: "CREATE", entity: "USER", entityId: user.id, newData: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
  return buildUserResponse(user);
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; password?: string; isAdmin?: boolean; roleId?: string; permissionOverrides?: string[] },
  adminId: string,
) {
  const old = await prisma.user.findUnique({ where: { id }, omit: USER_OMIT, include: USER_INCLUDE });
  if (!old) return null;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
  if (data.roleId !== undefined) updateData.roleId = data.roleId || null;
  if (data.permissionOverrides !== undefined) updateData.permissionOverrides = data.permissionOverrides;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.update({ where: { id }, data: updateData, omit: USER_OMIT, include: USER_INCLUDE });
  await createAuditLog({ userId: adminId, action: "UPDATE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown>, newData: user as unknown as Record<string, unknown> });
  return buildUserResponse(user);
}

export async function deleteUser(id: string, adminId: string) {
  if (id === adminId) throw new Error("Não é possível deletar a si mesmo");
  const old = await prisma.user.findUnique({ where: { id }, omit: USER_OMIT, include: USER_INCLUDE });
  if (!old) return null;
  await prisma.user.delete({ where: { id } });
  await createAuditLog({ userId: adminId, action: "DELETE", entity: "USER", entityId: id, oldData: old as unknown as Record<string, unknown> });
  return old;
}
