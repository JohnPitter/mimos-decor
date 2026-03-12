import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { logger } from "../lib/logger.js";
import * as gatewayService from "../services/gateway.service.js";

export const gatewayRouter = Router();
gatewayRouter.use(authMiddleware);

// List is available to all authenticated users (needed for sale forms)
gatewayRouter.get("/", async (_req, res) => {
  try {
    const gateways = await gatewayService.listGateways();
    res.json({ gateways });
  } catch (err) {
    logger.error("List gateways error", "gateway", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

// Create/Update/Delete require ADMIN
gatewayRouter.post("/", requirePermission("gateways:manage"), async (req, res) => {
  try {
    const gateway = await gatewayService.createGateway(req.body);
    logger.info(`Gateway created: ${gateway.slug}`, "gateway");
    res.status(201).json(gateway);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});

gatewayRouter.put("/:id", requirePermission("gateways:manage"), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const gateway = await gatewayService.updateGateway(id, req.body);
    if (!gateway) { res.status(404).json({ error: "Gateway não encontrado" }); return; }
    logger.info(`Gateway updated: ${gateway.slug}`, "gateway");
    res.json(gateway);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});

gatewayRouter.delete("/:id", requirePermission("gateways:manage"), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const gateway = await gatewayService.deleteGateway(id);
    if (!gateway) { res.status(404).json({ error: "Gateway não encontrado" }); return; }
    logger.info(`Gateway deleted: ${gateway.slug}`, "gateway");
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});
