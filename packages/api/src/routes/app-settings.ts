import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

export const appSettingsRouter = Router();
appSettingsRouter.use(authMiddleware);

const SINGLETON_ID = "singleton";

async function getOrCreateSettings() {
  let settings = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (!settings) {
    settings = await prisma.appSettings.create({ data: { id: SINGLETON_ID } });
  }
  return settings;
}

appSettingsRouter.get("/", async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    logger.error("Get app settings error", "settings", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});

appSettingsRouter.put("/", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: "Apenas administradores" });
      return;
    }
    await getOrCreateSettings();
    const settings = await prisma.appSettings.update({
      where: { id: SINGLETON_ID },
      data: {
        allowSaleDeletion: req.body.allowSaleDeletion,
      },
    });
    logger.info("App settings updated", "settings");
    res.json(settings);
  } catch (err) {
    logger.error("Update app settings error", "settings", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
