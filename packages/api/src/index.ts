import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { productRouter } from "./routes/products.js";
import { saleRouter } from "./routes/sales.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { userRouter } from "./routes/users.js";
import { auditLogRouter } from "./routes/audit-logs.js";
import { logger } from "./lib/logger.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware pipeline
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("short"));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", userRouter);
app.use("/api/audit-logs", auditLogRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/", (_req, res) => {
  res.json({ name: "mimos-decor-api", status: "ok" });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, "server");
});

export default app;
