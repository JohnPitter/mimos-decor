import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { productRouter } from "./routes/products.js";
import { saleRouter } from "./routes/sales.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { userRouter } from "./routes/users.js";
import { auditLogRouter } from "./routes/audit-logs.js";
import { gatewayRouter } from "./routes/gateways.js";
import { roleRouter } from "./routes/roles.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware pipeline
app.use(
  cors({
    origin: isProduction ? true : ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("short"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve uploaded files
const storagePath = process.env.STORAGE_PATH || path.resolve("uploads");
app.use("/uploads", express.static(storagePath));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", userRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/gateways", gatewayRouter);
app.use("/api/roles", roleRouter);

// In production, serve the frontend build
if (isProduction) {
  const webDist = path.resolve(__dirname, "../../web/dist");
  app.use(express.static(webDist));
  // SPA fallback: any non-API route returns index.html (Express 5 syntax)
  app.get("{*path}", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, "server");
});

export default app;
