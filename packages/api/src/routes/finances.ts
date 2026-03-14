import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as financeService from "../services/finance.service.js";

export const financeRouter = Router();
financeRouter.use(authMiddleware);

// Entries
financeRouter.get("/", async (req, res) => {
  try {
    const { search, type, status, categoryId, startDate, endDate, page, limit } = req.query;
    const result = await financeService.listEntries({
      search: search as string,
      type: type as string,
      status: status as string,
      categoryId: categoryId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List finance entries error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.get("/summary", async (_req, res) => {
  try {
    const summary = await financeService.getSummary();
    res.json(summary);
  } catch (err) {
    logger.error("Finance summary error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.get("/notifications", async (_req, res) => {
  try {
    const notifications = await financeService.getNotifications();
    res.json(notifications);
  } catch (err) {
    logger.error("Finance notifications error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.post("/", async (req, res) => {
  try {
    const result = await financeService.createEntry(req.body, req.user!.id);
    logger.info("Finance entry created", "finance");
    res.status(201).json(result);
  } catch (err) {
    logger.error("Create finance entry error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.put("/:id", async (req, res) => {
  try {
    const entry = await financeService.updateEntry(req.params.id, req.body, req.user!.id);
    if (!entry) { res.status(404).json({ error: "Conta não encontrada" }); return; }
    res.json(entry);
  } catch (err) {
    logger.error("Update finance entry error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.delete("/:id", async (req, res) => {
  try {
    const entry = await financeService.deleteEntry(req.params.id, req.user!.id);
    if (!entry) { res.status(404).json({ error: "Conta não encontrada" }); return; }
    res.json({ ok: true });
  } catch (err) {
    logger.error("Delete finance entry error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.delete("/group/:groupId", async (req, res) => {
  try {
    const result = await financeService.deleteRecurringGroup(req.params.groupId, req.user!.id);
    if (!result) { res.status(404).json({ error: "Grupo não encontrado" }); return; }
    res.json({ ok: true, count: result.length });
  } catch (err) {
    logger.error("Delete recurring group error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeRouter.patch("/:id/pay", async (req, res) => {
  try {
    const entry = await financeService.payEntry(req.params.id, req.user!.id);
    if (!entry) { res.status(404).json({ error: "Conta não encontrada" }); return; }
    res.json(entry);
  } catch (err) {
    logger.error("Pay finance entry error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

// Categories
export const financeCategoryRouter = Router();
financeCategoryRouter.use(authMiddleware);

financeCategoryRouter.get("/", async (_req, res) => {
  try {
    await financeService.seedDefaultCategories();
    const categories = await financeService.listCategories();
    res.json(categories);
  } catch (err) {
    logger.error("List finance categories error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeCategoryRouter.post("/", async (req, res) => {
  try {
    const category = await financeService.createCategory(req.body, req.user!.id);
    res.status(201).json(category);
  } catch (err) {
    logger.error("Create finance category error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeCategoryRouter.put("/:id", async (req, res) => {
  try {
    const category = await financeService.updateCategory(req.params.id, req.body, req.user!.id);
    if (!category) { res.status(404).json({ error: "Categoria não encontrada" }); return; }
    res.json(category);
  } catch (err) {
    logger.error("Update finance category error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

financeCategoryRouter.delete("/:id", async (req, res) => {
  try {
    const category = await financeService.deleteCategory(req.params.id, req.user!.id);
    if (!category) { res.status(404).json({ error: "Categoria não encontrada" }); return; }
    res.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "CATEGORY_HAS_ENTRIES") {
      res.status(400).json({ error: "Categoria possui contas vinculadas" });
      return;
    }
    logger.error("Delete finance category error", "finance", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
