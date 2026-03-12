import { prisma } from "../lib/prisma.js";

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export async function createRole(data: { name: string; permissions: string[] }) {
  return prisma.role.create({ data: { name: data.name, permissions: data.permissions } });
}

export async function updateRole(id: string, data: { name?: string; permissions?: string[] }) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return null;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  return prisma.role.update({ where: { id }, data: updateData });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return null;
  if (role._count.users > 0) {
    throw new Error(`Não é possível excluir: ${role._count.users} usuário(s) vinculado(s)`);
  }
  await prisma.role.delete({ where: { id } });
  return role;
}
