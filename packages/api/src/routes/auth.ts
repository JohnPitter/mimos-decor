import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

export const authRouter = Router();

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  roleId: true,
  permissionOverrides: true,
  themeColors: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, permissions: true, createdAt: true, updatedAt: true } },
};

function buildUserResponse(user: Record<string, unknown> & { role?: { permissions?: string[] } | null; permissionOverrides?: string[] }) {
  const rolePerms = user.role?.permissions ?? [];
  const overrides = (user.permissionOverrides as string[]) ?? [];
  const permissions = [...new Set([...rolePerms, ...overrides])];
  return { ...user, permissions };
}

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email }, include: { role: { select: { id: true, name: true, permissions: true, createdAt: true, updatedAt: true } } } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }
    const token = signToken({ userId: user.id });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    logger.info(`User ${user.email} logged in`, "auth");
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: buildUserResponse(userWithoutPassword) });
  } catch (err) {
    logger.error("Login error", "auth", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: USER_SELECT });
  if (!user) { res.status(401).json({ error: "Usuário não encontrado" }); return; }
  res.json({ user: buildUserResponse(user) });
});

authRouter.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, email, currentPassword, newPassword, themeColors } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: "Senha atual é obrigatória para alterar a senha" });
        return;
      }
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        res.status(400).json({ error: "Senha atual incorreta" });
        return;
      }
    }

    if (email && email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        res.status(400).json({ error: "Email já está em uso" });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);
    if (themeColors !== undefined) updateData.themeColors = themeColors;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT,
    });

    logger.info(`User ${updated.email} updated profile`, "auth");
    res.json({ user: buildUserResponse(updated) });
  } catch (err) {
    logger.error("Profile update error", "auth", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
