import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { redeemRewardTransaction } from "../services/rewardService";

export const rewardController = Router();

rewardController.get("/catalog", authenticate, async (_req: AuthRequest, res: Response) => {
  const rewards = await prisma.rewardCatalog.findMany({
    where: { isActive: true },
    orderBy: { costPoints: "asc" },
  });
  res.json({ success: true, data: rewards });
});

rewardController.get("/balance", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const totalReceived = await prisma.pointLedger.aggregate({
    where: { userId, reason: "kudo_received" },
    _sum: { delta: true },
  });

  const totalRedeemed = await prisma.pointLedger.aggregate({
    where: { userId, reason: "redeemed" },
    _sum: { delta: true },
  });

  const totalSent = await prisma.pointLedger.aggregate({
    where: { userId, reason: "kudo_sent" },
    _sum: { delta: true },
  });

  const balance = (totalReceived._sum.delta || 0) + (totalRedeemed._sum.delta || 0);

  res.json({
    success: true,
    data: {
      balance,
      received: totalReceived._sum.delta || 0,
      sent: Math.abs(totalSent._sum.delta || 0),
      redeemed: Math.abs(totalRedeemed._sum.delta || 0),
    },
  });
});

rewardController.post("/redeem", authenticate, async (req: AuthRequest, res: Response) => {
  const { rewardId, idempotencyKey } = z.object({
    rewardId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
  }).parse(req.body);

  const redemption = await redeemRewardTransaction(
    req.user!.userId,
    rewardId,
    idempotencyKey
  );

  res.status(201).json({ success: true, data: redemption });
});

rewardController.get("/redemptions", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [redemptions, total] = await Promise.all([
    prisma.redemption.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.redemption.count({ where: { userId } }),
  ]);

  res.json({
    success: true,
    data: redemptions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
