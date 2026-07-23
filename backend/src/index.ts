import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { authController } from "./controllers/auth";
import { kudoController } from "./controllers/kudos";
import { rewardController } from "./controllers/rewards";
import { feedController } from "./controllers/feed";
import { notificationController } from "./controllers/notifications";
import { userController } from "./controllers/users";
import { uploadController } from "./controllers/upload";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { setupSocketHandlers } from "./services/socket";
import { startBudgetResetCron } from "./services/budgetCron";

export const prisma = new PrismaClient();
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const pubClient = redis.duplicate();
const subClient = redis.duplicate();

const app = express();
const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  adapter: createAdapter(pubClient, subClient),
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(rateLimiter);

app.use("/api/auth", authController);
app.use("/api/kudos", kudoController);
app.use("/api/rewards", rewardController);
app.use("/api/feed", feedController);
app.use("/api/notifications", notificationController);
app.use("/api/users", userController);
app.use("/api/upload", uploadController);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(errorHandler);

setupSocketHandlers(io);

startBudgetResetCron();

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
