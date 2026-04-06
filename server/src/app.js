import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/game.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:5173"],
      credentials: true
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(limiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/game", gameRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error"
    });
  });

  return app;
}
