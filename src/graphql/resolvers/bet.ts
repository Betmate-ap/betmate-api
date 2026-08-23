import { BetStatus } from "@prisma/client";
import { ChallengeService } from "../../services/bet/challenge.service";
import { StatsService } from "../../services/bet/stats.service";
import { type Context, requireAuth } from "../context";

export const betQueries = {
  myBets: async (
    _: unknown,
    { status }: { status?: BetStatus },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).getMyBets(userId, status);
  },

  headToHead: async (
    _: unknown,
    { betmateId }: { betmateId: string },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new StatsService(ctx.prisma).getHeadToHead(userId, betmateId);
  },

  leaderboard: async (_: unknown, __: unknown, ctx: Context) => {
    const userId = requireAuth(ctx);
    return new StatsService(ctx.prisma).getLeaderboard(userId);
  },
};

export const betMutations = {
  sendChallenge: async (
    _: unknown,
    { input }: { input: { matchId: string; challengeeId: string } },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).sendChallenge(
      currentUserId,
      input.matchId,
      input.challengeeId,
    );
  },

  acceptChallenge: async (
    _: unknown,
    { betId }: { betId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).acceptChallenge(
      betId,
      currentUserId,
    );
  },

  cancelChallenge: async (
    _: unknown,
    { betId }: { betId: string },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).cancelChallenge(betId, userId);
  },

  declineChallenge: async (
    _: unknown,
    { betId }: { betId: string },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).declineChallenge(
      betId,
      currentUserId,
    );
  },

  flipCoin: async (_: unknown, { betId }: { betId: string }, ctx: Context) => {
    const currentUserId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).flipCoin(betId, currentUserId);
  },

  selectTeam: async (
    _: unknown,
    { input }: { input: { betId: string; team: string } },
    ctx: Context,
  ) => {
    const currentUserId = requireAuth(ctx);
    return new ChallengeService(ctx.prisma).selectTeam(
      input.betId,
      currentUserId,
      input.team,
    );
  },
};
