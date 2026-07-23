import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../index";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(io: SocketIOServer): void {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const decoded = jwt.verify(token as string, JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.join(`user:${socket.userId}`);
    socket.join("feed:global");

    socket.on("feed:typing", (data: { kudoId: string }) => {
      socket.to("feed:global").emit("feed:typing", {
        userId: socket.userId,
        kudoId: data.kudoId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}

export async function emitNewKudo(kudoId: string): Promise<void> {
  const { io } = await import("../index");
  const kudo = await prisma.kudo.findUnique({
    where: { id: kudoId },
    include: {
      fromUser: { select: { id: true, name: true, avatarUrl: true } },
      toUser: { select: { id: true, name: true, avatarUrl: true } },
      media: true,
    },
  });

  if (kudo) {
    io.to("feed:global").emit("kudo:new", kudo);
  }
}

export async function emitNotification(userId: string, notificationId: string): Promise<void> {
  const { io } = await import("../index");
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (notification) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }
}
