import { prisma } from "../index";
import { AppError } from "../middleware/errorHandler";

export async function redeemRewardTransaction(
  userId: string,
  rewardId: string,
  idempotencyKey: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.redemption.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    const reward = await tx.rewardCatalog.findUniqueOrThrow({
      where: { id: rewardId },
    });

    if (!reward.isActive) {
      throw new AppError(400, "This reward is no longer available");
    }

    if (reward.stock !== null && reward.stock <= 0) {
      throw new AppError(400, "This reward is out of stock");
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const totalReceived = await tx.pointLedger.aggregate({
      where: {
        userId,
        reason: "kudo_received",
      },
      _sum: { delta: true },
    });

    const totalRedeemed = await tx.pointLedger.aggregate({
      where: {
        userId,
        reason: "redeemed",
      },
      _sum: { delta: true },
    });

    const balance = (totalReceived._sum.delta || 0) + (totalRedeemed._sum.delta || 0);

    if (balance < reward.costPoints) {
      throw new AppError(400, `Insufficient points. You have ${balance} points but this reward costs ${reward.costPoints}`);
    }

    const redemption = await tx.redemption.create({
      data: {
        userId,
        rewardId,
        pointsSpent: reward.costPoints,
        status: "pending",
        idempotencyKey,
      },
      include: {
        reward: true,
      },
    });

    await tx.pointLedger.create({
      data: {
        userId,
        delta: -reward.costPoints,
        balanceAfter: balance - reward.costPoints,
        reason: "redeemed",
        referenceId: redemption.id,
      },
    });

    if (reward.stock !== null) {
      await tx.rewardCatalog.update({
        where: { id: rewardId },
        data: { stock: { decrement: 1 } },
      });
    }

    return redemption;
  });
}
