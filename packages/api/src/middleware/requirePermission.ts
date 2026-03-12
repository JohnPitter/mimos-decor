import type { Request, Response, NextFunction } from "express";

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    if (req.user.isAdmin) {
      next();
      return;
    }
    const userPerms = new Set(req.user.permissions);
    const hasAll = permissions.every((p) => userPerms.has(p));
    if (!hasAll) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    next();
  };
}
