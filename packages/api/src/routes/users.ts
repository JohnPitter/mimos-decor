import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { logger } from "../lib/logger.js";
import * as userService from "../services/user.service.js";

export const userRouter = Router();
userRouter.use(authMiddleware, requirePermission("users:manage"));

userRouter.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.listUsers({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
    res.json(result);
  } catch (err) {
    logger.error("List users error", "user", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

userRouter.post("/", async (req, res) => {
  try {
    const user = await userService.createUser(req.body, req.user!.id);
    logger.info(`User created: ${user.email}`, "user");
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});

userRouter.put("/:id", async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id as string, req.body, req.user!.id);
    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
    logger.info(`User updated: ${user.email}`, "user");
    res.json(user);
  } catch (err) {
    logger.error("Update user error", "user", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

userRouter.delete("/:id", async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id as string, req.user!.id);
    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
    logger.info(`User deleted: ${user.email}`, "user");
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ error: message });
  }
});
