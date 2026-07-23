import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

export const feedController = Router();

feedController.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [kudos, total] = await Promise.all([
    prisma.kudo.findMany({
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
          take: 3, // Show only latest 3 comments in feed
        },
        _count: { select: { comments: true, reactions: true } },
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kudo.count(),
  ]);

  res.json({
    success: true,
    data: kudos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
