import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as supplyService from "../services/supply.service.js";

export const supplyRouter = Router();
supplyRouter.use(authMiddleware);

supplyRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await supplyService.listSupplies({
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List supplies error", "supply", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

supplyRouter.post("/", async (req, res) => {
  try {
    const supply = await supplyService.createSupply(req.body);
    logger.info(`Supply created: ${supply.name}`, "supply");
    res.status(201).json(supply);
  } catch (err) {
    logger.error("Create supply error", "supply", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

supplyRouter.post("/:id/purchase", async (req, res) => {
  try {
    const purchase = await supplyService.registerPurchase(
      { supplyId: req.params.id, ...req.body },
      req.user!.id,
    );
    res.status(201).json(purchase);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "SUPPLY_NOT_FOUND") { res.status(404).json({ error: "Insumo não encontrado" }); return; }
    if (msg === "CATEGORY_NOT_FOUND") { res.status(500).json({ error: "Categoria financeira não encontrada" }); return; }
    logger.error("Register purchase error", "supply", { error: msg });
    res.status(500).json({ error: "Erro interno" });
  }
});

supplyRouter.put("/:id", async (req, res) => {
  try {
    const supply = await supplyService.updateSupply(req.params.id, req.body);
    if (!supply) { res.status(404).json({ error: "Insumo não encontrado" }); return; }
    res.json(supply);
  } catch (err) {
    logger.error("Update supply error", "supply", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

supplyRouter.delete("/:id", async (req, res) => {
  try {
    const supply = await supplyService.deleteSupply(req.params.id);
    if (!supply) { res.status(404).json({ error: "Insumo não encontrado" }); return; }
    res.json({ ok: true });
  } catch (err) {
    logger.error("Delete supply error", "supply", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
