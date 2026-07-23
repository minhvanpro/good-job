-- CreateEnum
CREATE TYPE "ReactionIcon" AS ENUM ('thumb_up', 'favorite', 'celebration', 'whatshot', 'fitness_center', 'star');

-- AlterTable: add a temporary column, migrate data, drop old column
ALTER TABLE "kudo_reactions" ADD COLUMN "icon" "ReactionIcon" NOT NULL DEFAULT 'thumb_up';

-- Drop the old unique index that included emoji
DROP INDEX IF EXISTS "kudo_reactions_kudoId_userId_emoji_key";

-- Create the new unique index on icon instead
CREATE UNIQUE INDEX "kudo_reactions_kudoId_userId_icon_key" ON "kudo_reactions"("kudoId", "userId", "icon");

-- Drop the old emoji column
ALTER TABLE "kudo_reactions" DROP COLUMN "emoji";
