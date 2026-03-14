import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import * as saleService from "../services/sale.service.js";

export const saleRouter = Router();
saleRouter.use(authMiddleware);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

saleRouter.get("/", async (req, res) => {
  try {
    const { status, gateway, startDate, endDate, page, limit } = req.query;
    const result = await saleService.listSales({
      status: status as any,
      gateway: gateway as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List sales error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.get("/:id", async (req, res) => {
  try {
    const sale = await saleService.getSale(req.params.id);
    if (!sale) { res.status(404).json({ error: "Venda não encontrada" }); return; }
    res.json(sale);
  } catch (err) {
    logger.error("Get sale error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.post("/", async (req, res) => {
  try {
    const sale = await saleService.createSale(req.body, req.user!.id);
    logger.info("Sale created", "sale", { saleId: sale.id });
    res.status(201).json(sale);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    logger.error("Create sale error", "sale", { error: message });
    res.status(400).json({ error: message });
  }
});

saleRouter.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const sale = await saleService.updateSaleStatus(req.params.id, status, req.user!.id);
    if (!sale) { res.status(404).json({ error: "Venda não encontrada" }); return; }
    logger.info(`Sale ${req.params.id} status → ${status}`, "sale");
    res.json(sale);
  } catch (err) {
    logger.error("Update sale status error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.delete("/:id", async (req, res) => {
  try {
    try {
      const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
      if (settings && !settings.allowSaleDeletion) {
        res.status(403).json({ error: "Exclusão de vendas desativada pelo administrador" });
        return;
      }
    } catch {
      // Table may not exist yet — allow by default
    }
    const sale = await saleService.deleteSale(req.params.id, req.user!.id);
    if (!sale) { res.status(404).json({ error: "Venda não encontrada" }); return; }
    logger.info(`Sale deleted: ${req.params.id}`, "sale");
    res.json({ ok: true });
  } catch (err) {
    logger.error("Delete sale error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

saleRouter.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ error: "Arquivo CSV é obrigatório" }); return; }
    const { gateway } = req.body;
    if (!gateway) { res.status(400).json({ error: "Gateway é obrigatório" }); return; }
    const result = await saleService.importSalesFromCSV(req.file.buffer, gateway, req.user!.id);
    logger.info(`CSV import: ${result.success} sales, ${result.errors.length} errors`, "sale");
    res.json(result);
  } catch (err) {
    logger.error("Import CSV error", "sale", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
