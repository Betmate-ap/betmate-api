import { PrismaClient, BetStatus, MatchStatus } from "@prisma/client";
import { GraphQLError } from "graphql";
import { AuthService, SignupInput, LoginInput } from "../services/authService";
import { FriendService } from "../services/friendService";
import { MatchService } from "../services/matchService";
import { BetService } from "../services/betService";
import type { Request, Response } from "express";

type Context = {
  user?: { userId: string } | null;
  prisma: PrismaClient;
  req: Request;
  res: Response;
};

function requireAuth(ctx: Context): string {
  if (!ctx.user?.userId) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.user.userId;
}

export const resolvers = {
  Query: {
    health: () => "ok",

    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return new AuthService(ctx.prisma).getUserById(ctx.user.userId);
    },

    // ── Betmates ──────────────────────────────────────────────────────────────

    myBetmates: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return new FriendService(ctx.prisma).getMyBetmates(userId);
    },

    pendingFriendRequests: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return new FriendService(ctx.prisma).getPendingFriendRequests(userId);
    },

    sentFriendRequests: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return new FriendService(ctx.prisma).getSentFriendRequests(userId);
    },

    searchUsers: async (
      _: unknown,
      { query }: { query: string },
      ctx: Context,
    ) => {
      const userId = requireAuth(ctx);
      return new FriendService(ctx.prisma).searchUsers(query, userId);
    },

    // ── Matches ───────────────────────────────────────────────────────────────

    matches: async (
      _: unknown,
      { status }: { status?: MatchStatus },
      ctx: Context,
    ) => {
      requireAuth(ctx);
      return new MatchService(ctx.prisma).getMatches(status);
    },

    match: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      return new MatchService(ctx.prisma).getMatch(id);
    },

    // ── Bets ──────────────────────────────────────────────────────────────────

    myBets: async (
      _: unknown,
      { status }: { status?: BetStatus },
      ctx: Context,
    ) => {
      const userId = requireAuth(ctx);
      return new BetService(ctx.prisma).getMyBets(userId, status);
    },

    headToHead: async (
      _: unknown,
      { betmateId }: { betmateId: string },
      ctx: Context,
    ) => {
      const userId = requireAuth(ctx);
      return new BetService(ctx.prisma).getHeadToHead(userId, betmateId);
    },

    leaderboard: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = requireAuth(ctx);
      return new BetService(ctx.prisma).getLeaderboard(userId);
    },
  },

  Mutation: {
    // ── Auth ──────────────────────────────────────────────────────────────────

    signup: async (
      _: unknown,
      { input }: { input: SignupInput },
      ctx: Context,
    ) => {
      const result = await new AuthService(ctx.prisma).signup(input);
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return result;
    },

    login: async (
      _: unknown,
      { input }: { input: LoginInput },
      ctx: Context,
    ) => {
      const result = await new AuthService(ctx.prisma).login(input);
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return result;
    },

    refreshToken: async (_: unknown, __: unknown, ctx: Context) => {
      const token = ctx.req.cookies?.refreshToken;
      if (!token) {
        throw new GraphQLError("No refresh token provided", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const result = await new AuthService(ctx.prisma).refreshToken(token);
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return result;
    },

    logout: async (_: unknown, __: unknown, ctx: Context) => {
      const token = ctx.req.cookies?.refreshToken;
      if (token) {
        await new AuthService(ctx.prisma).logout(token);
      }
      ctx.res.clearCookie("refreshToken");
      return true;
    },

    sendVerificationEmail: async (_: unknown, __: unknown, _ctx: Context) => {
      // TODO: implement email verification
      return true;
    },

    verifyEmail: async (
      _: unknown,
      { token }: { token: string },
      _ctx: Context,
    ) => {
      // TODO: implement email verification
      console.log("Email verification token:", token);
      return true;
    },

    forgotPassword: async (
      _: unknown,
      { email }: { email: string },
      _ctx: Context,
    ) => {
      // TODO: implement password reset
      console.log("Password reset requested for:", email);
      return true;
    },

    resetPassword: async (
      _: unknown,
      { input }: { input: { token: string; newPassword: string } },
      _ctx: Context,
    ) => {
      // TODO: implement password reset
      console.log("Password reset for token:", input.token);
      return true;
    },

    // ── Betmates ──────────────────────────────────────────────────────────────

    sendFriendRequest: async (
      _: unknown,
      { userId }: { userId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new FriendService(ctx.prisma).sendFriendRequest(
        currentUserId,
        userId,
      );
    },

    acceptFriendRequest: async (
      _: unknown,
      { friendshipId }: { friendshipId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new FriendService(ctx.prisma).acceptFriendRequest(
        friendshipId,
        currentUserId,
      );
    },

    declineFriendRequest: async (
      _: unknown,
      { friendshipId }: { friendshipId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new FriendService(ctx.prisma).declineFriendRequest(
        friendshipId,
        currentUserId,
      );
    },

    removeBetmate: async (
      _: unknown,
      { userId }: { userId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new FriendService(ctx.prisma).removeBetmate(currentUserId, userId);
    },

    blockUser: async (
      _: unknown,
      { userId }: { userId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      await new FriendService(ctx.prisma).blockUser(currentUserId, userId);
      return true;
    },

    unblockUser: async (
      _: unknown,
      { userId }: { userId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new FriendService(ctx.prisma).unblockUser(currentUserId, userId);
    },

    // ── Bets ──────────────────────────────────────────────────────────────────

    sendChallenge: async (
      _: unknown,
      { input }: { input: { matchId: string; challengeeId: string } },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new BetService(ctx.prisma).sendChallenge(
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
      return new BetService(ctx.prisma).acceptChallenge(betId, currentUserId);
    },

    declineChallenge: async (
      _: unknown,
      { betId }: { betId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new BetService(ctx.prisma).declineChallenge(betId, currentUserId);
    },

    flipCoin: async (
      _: unknown,
      { betId }: { betId: string },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new BetService(ctx.prisma).flipCoin(betId, currentUserId);
    },

    selectTeam: async (
      _: unknown,
      { input }: { input: { betId: string; team: string } },
      ctx: Context,
    ) => {
      const currentUserId = requireAuth(ctx);
      return new BetService(ctx.prisma).selectTeam(
        input.betId,
        currentUserId,
        input.team,
      );
    },
  },
};
