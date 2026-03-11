import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import * as dashboardService from "../services/dashboard.service.js";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getDashboardData({
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(data);
  } catch (err) {
    logger.error("Dashboard error", "dashboard", { error: String(err) });
    res.status(500).json({ error: "Erro interno" });
  }
});
