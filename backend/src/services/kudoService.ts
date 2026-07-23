import { prisma } from "../index";
import { AppError } from "../middleware/errorHandler";
import { CreateKudoInput } from "../types";

export async function createKudoTransaction(
  fromUserId: string,
  data: CreateKudoInput
) {
  return prisma.$transaction(async (tx) => {
    const sender = await tx.user.findUniqueOrThrow({
      where: { id: fromUserId },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spentThisMonth = await tx.pointLedger.aggregate({
      where: {
        userId: fromUserId,
        reason: "kudo_sent",
        createdAt: { gte: monthStart },
      },
      _sum: { delta: true },
    });

    const totalSpent = Math.abs(spentThisMonth._sum.delta || 0);
    const remainingBudget = sender.monthlyBudget - totalSpent;

    if (remainingBudget < data.points) {
      throw new AppError(400, `Insufficient budget. You have ${remainingBudget} points remaining this month`);
    }

    const receiver = await tx.user.findUniqueOrThrow({
      where: { id: data.toUserId },
    });

    const validMedia = data.mediaUrls?.filter(m => m.url && m.url.length > 0) ?? [];

    const kudo = await tx.kudo.create({
      data: {
        points: data.points,
        description: data.description,
        coreValue: data.coreValue,
        fromUserId,
        toUserId: data.toUserId,
        media: validMedia.length > 0 ? {
          create: validMedia.map(m => ({
            url: m.url,
            type: m.type,
            duration: m.duration,
          })),
        } : undefined,
      },
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
        media: true,
      },
    });

    await tx.pointLedger.create({
      data: {
        userId: fromUserId,
        delta: -data.points,
        balanceAfter: remainingBudget - data.points,
        reason: "kudo_sent",
        referenceId: kudo.id,
      },
    });

    const receiverTotal = await tx.pointLedger.aggregate({
      where: { userId: data.toUserId },
      _sum: { delta: true },
    });
    const receiverBalance = (receiverTotal._sum.delta || 0) + data.points;

    await tx.pointLedger.create({
      data: {
        userId: data.toUserId,
        delta: data.points,
        balanceAfter: receiverBalance,
        reason: "kudo_received",
        referenceId: kudo.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: data.toUserId,
        type: "kudo_received",
        message: `You received ${data.points} points from ${sender.name} for ${data.coreValue}!`,
      },
    });

    return kudo;
  });
}
