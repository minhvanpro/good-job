import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { kudoRateLimiter } from "../middleware/rateLimiter";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { createKudoTransaction } from "../services/kudoService";

export const kudoController = Router();

const createKudoSchema = z.object({
  toUserId: z.string().uuid(),
  points: z.number().int().min(10).max(50),
  description: z.string().min(1).max(500),
  coreValue: z.enum(["Teamwork", "Ownership", "Innovation", "Integrity", "Excellence", "Respect"]),
  mediaUrls: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["image", "video"]),
    duration: z.number().int().optional(),
  })).max(5).optional(),
});

kudoController.post("/", authenticate, kudoRateLimiter, async (req: AuthRequest, res: Response) => {
  const data = createKudoSchema.parse(req.body);
  const fromUserId = req.user!.userId;

  if (fromUserId === data.toUserId) {
    throw new AppError(400, "Cannot send kudo to yourself");
  }

  const kudo = await createKudoTransaction(fromUserId, data);
  res.status(201).json({ success: true, data: kudo });
});

kudoController.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const type = req.query.type as string;

  const where: Record<string, unknown> = {};
  if (type === "sent") where.fromUserId = userId;
  else if (type === "received") where.toUserId = userId;
  else {
    where.OR = [{ fromUserId: userId }, { toUserId: userId }];
  }

  const [kudos, total] = await Promise.all([
    prisma.kudo.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
        reactions: { include: { user: { select: { id: true, name: true } } } },
        comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kudo.count({ where }),
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

kudoController.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const kudo = await prisma.kudo.findUnique({
    where: { id: req.params.id },
    include: {
      fromUser: { select: { id: true, name: true, avatarUrl: true } },
      toUser: { select: { id: true, name: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      media: true,
    },
  });

  if (!kudo) {
    throw new AppError(404, "Kudo not found");
  }

  res.json({ success: true, data: kudo });
});

kudoController.post("/:id/react", authenticate, async (req: AuthRequest, res: Response) => {
  const { icon } = z.object({
    icon: z.enum(["thumb_up", "favorite", "celebration", "whatshot", "fitness_center", "star"]),
  }).parse(req.body);
  const kudoId = req.params.id;
  const userId = req.user!.userId;

  const reaction = await prisma.kudoReaction.upsert({
    where: { kudoId_userId_icon: { kudoId, userId, icon } },
    update: {},
    create: { kudoId, userId, icon },
  });

  res.status(201).json({ success: true, data: reaction });
});

kudoController.delete("/:id/react/:icon", authenticate, async (req: AuthRequest, res: Response) => {
  const icon = req.params.icon as "thumb_up" | "favorite" | "celebration" | "whatshot" | "fitness_center" | "star";
  await prisma.kudoReaction.deleteMany({
    where: {
      kudoId: req.params.id,
      userId: req.user!.userId,
      icon,
    },
  });
  res.json({ success: true });
});

kudoController.post("/:id/comment", authenticate, async (req: AuthRequest, res: Response) => {
  const { content, mediaUrl } = z.object({
    content: z.string().min(1).max(1000),
    mediaUrl: z.string().url().optional(),
  }).parse(req.body);

  const comment = await prisma.kudoComment.create({
    data: {
      kudoId: req.params.id,
      userId: req.user!.userId,
      content,
      mediaUrl,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: comment });
});
