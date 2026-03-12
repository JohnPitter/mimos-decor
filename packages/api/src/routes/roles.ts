import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { logger } from "../lib/logger.js";
import * as roleService from "../services/role.service.js";

export const roleRouter = Router();
roleRouter.use(authMiddleware);

roleRouter.get("/", async (_req, res) => {
  try {
    const roles = await roleService.listRoles();
    res.json({ roles });
  } catch (err) {
    logger.error("List roles error", "role", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

roleRouter.post("/", requirePermission("users:manage"), async (req, res) => {
  try {
    const role = await roleService.createRole(req.body);
    logger.info(`Role created: ${role.name}`, "role");
    res.status(201).json(role);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});

roleRouter.put("/:id", requirePermission("users:manage"), async (req, res) => {
  try {
    const role = await roleService.updateRole(req.params.id as string, req.body);
    if (!role) { res.status(404).json({ error: "Perfil não encontrado" }); return; }
    logger.info(`Role updated: ${role.name}`, "role");
    res.json(role);
  } catch (err) {
    logger.error("Update role error", "role", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

roleRouter.delete("/:id", requirePermission("users:manage"), async (req, res) => {
  try {
    const role = await roleService.deleteRole(req.params.id as string);
    if (!role) { res.status(404).json({ error: "Perfil não encontrado" }); return; }
    logger.info(`Role deleted: ${role.name}`, "role");
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});
