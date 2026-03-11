import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { logger } from "../lib/logger.js";
import * as auditService from "../services/audit.service.js";

export const auditLogRouter = Router();
auditLogRouter.use(authMiddleware, requireRole("ADMIN"));

auditLogRouter.get("/", async (req, res) => {
  try {
    const { userId, action, entity, startDate, endDate, page, limit } = req.query;
    const result = await auditService.listAuditLogs({
      userId: userId as string,
      action: action as string,
      entity: entity as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List audit logs error", "audit", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
