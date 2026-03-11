import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import { uploadProductImage } from "../lib/upload.js";
import { prisma } from "../lib/prisma.js";
import * as productService from "../services/product.service.js";

export const productRouter = Router();
productRouter.use(authMiddleware);

productRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await productService.listProducts({
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error("List products error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.get("/:id", async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    res.json(product);
  } catch (err) {
    logger.error("Get product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.post("/", async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.user!.id);
    logger.info(`Product created: ${product.name}`, "product");
    res.status(201).json(product);
  } catch (err) {
    logger.error("Create product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.put("/:id", async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user!.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    logger.info(`Product updated: ${product.name}`, "product");
    res.json(product);
  } catch (err) {
    logger.error("Update product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.delete("/:id", async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id, req.user!.id);
    if (!product) { res.status(404).json({ error: "Produto não encontrado" }); return; }
    logger.info(`Product deleted: ${product.name}`, "product");
    res.json({ ok: true });
  } catch (err) {
    logger.error("Delete product error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

productRouter.post("/:id/image", uploadProductImage.single("image"), async (req, res) => {
  try {
    const id = req.params.id as string;
    if (!req.file) {
      res.status(400).json({ error: "Nenhuma imagem enviada" });
      return;
    }
    const imageUrl = `/uploads/products/${req.file.filename}`;
    const product = await prisma.product.update({
      where: { id },
      data: { imageUrl },
    });
    logger.info(`Product image uploaded: ${product.name}`, "product");
    res.json({ imageUrl: product.imageUrl });
  } catch (err) {
    logger.error("Upload product image error", "product", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
