-- CreateEnum
CREATE TYPE "CoreValue" AS ENUM ('Teamwork', 'Ownership', 'Innovation', 'Integrity', 'Excellence', 'Respect');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "monthlyBudget" INTEGER NOT NULL DEFAULT 200,
    "budgetSpent" INTEGER NOT NULL DEFAULT 0,
    "budgetResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudos" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "coreValue" "CoreValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudo_media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER,
    "kudoId" TEXT NOT NULL,

    CONSTRAINT "kudo_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudo_reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "kudoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "kudo_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kudo_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kudoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "kudo_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "costPoints" INTEGER NOT NULL,
    "stock" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_ledger" (
    "id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "kudos_fromUserId_idx" ON "kudos"("fromUserId");

-- CreateIndex
CREATE INDEX "kudos_toUserId_idx" ON "kudos"("toUserId");

-- CreateIndex
CREATE INDEX "kudos_createdAt_idx" ON "kudos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kudo_reactions_kudoId_userId_emoji_key" ON "kudo_reactions"("kudoId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "redemptions_idempotencyKey_key" ON "redemptions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "redemptions_userId_idx" ON "redemptions"("userId");

-- CreateIndex
CREATE INDEX "redemptions_idempotencyKey_idx" ON "redemptions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "point_ledger_userId_idx" ON "point_ledger"("userId");

-- CreateIndex
CREATE INDEX "point_ledger_createdAt_idx" ON "point_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudo_media" ADD CONSTRAINT "kudo_media_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudo_reactions" ADD CONSTRAINT "kudo_reactions_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudo_reactions" ADD CONSTRAINT "kudo_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudo_comments" ADD CONSTRAINT "kudo_comments_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudo_comments" ADD CONSTRAINT "kudo_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "reward_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
