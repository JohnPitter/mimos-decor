import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string; role: string; createdAt: Date };
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
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
