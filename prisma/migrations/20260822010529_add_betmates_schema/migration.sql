-- CreateEnum
CREATE TYPE "public"."FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."BetStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."friendships" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "public"."FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "team1" VARCHAR(100) NOT NULL,
    "team2" VARCHAR(100) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "venue" VARCHAR(200),
    "tournament" VARCHAR(100) NOT NULL DEFAULT 'IPL',
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "winnerTeam" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bets" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "challengeeId" TEXT NOT NULL,
    "challengerPick" VARCHAR(100) NOT NULL,
    "challengeePick" VARCHAR(100),
    "status" "public"."BetStatus" NOT NULL DEFAULT 'PENDING',
    "pointsStake" INTEGER NOT NULL DEFAULT 10,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requesterId_receiverId_key" ON "public"."friendships"("requesterId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_externalId_key" ON "public"."matches"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "bets_matchId_challengerId_challengeeId_key" ON "public"."bets"("matchId", "challengerId", "challengeeId");

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bets" ADD CONSTRAINT "bets_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bets" ADD CONSTRAINT "bets_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bets" ADD CONSTRAINT "bets_challengeeId_fkey" FOREIGN KEY ("challengeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bets" ADD CONSTRAINT "bets_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
