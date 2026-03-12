import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        isAdmin: boolean;
        roleId: string | null;
        permissions: string[];
        permissionOverrides: string[];
        createdAt: Date;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        roleId: true,
        permissionOverrides: true,
        createdAt: true,
        role: { select: { permissions: true } },
      },
    });
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }

    const rolePerms = user.role?.permissions ?? [];
    const permissions = [...new Set([...rolePerms, ...user.permissionOverrides])];

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      roleId: user.roleId,
      permissions,
      permissionOverrides: user.permissionOverrides,
      createdAt: user.createdAt,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
