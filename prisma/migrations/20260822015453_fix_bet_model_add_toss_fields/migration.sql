-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."BetStatus" ADD VALUE 'TOSS_DONE';
ALTER TYPE "public"."BetStatus" ADD VALUE 'TEAMS_LOCKED';

-- AlterTable
ALTER TABLE "public"."bets" ADD COLUMN     "tossDoneAt" TIMESTAMP(3),
ADD COLUMN     "tossWinnerId" TEXT,
ALTER COLUMN "challengerPick" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."bets" ADD CONSTRAINT "bets_tossWinnerId_fkey" FOREIGN KEY ("tossWinnerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
