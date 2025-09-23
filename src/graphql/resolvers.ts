import { PrismaClient } from "@prisma/client";
import { AuthService, SignupInput, LoginInput } from "../services/authService";
import type { Request, Response } from "express";

type Context = {
  user?: { userId: string } | null;
  prisma: PrismaClient;
  req: Request;
  res: Response;
};

export const resolvers = {
  Query: {
    health: () => "ok",
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;

      const authService = new AuthService(ctx.prisma);
      return authService.getUserById(ctx.user.userId);
    },
  },

  Mutation: {
    signup: async (
      _: unknown,
      { input }: { input: SignupInput },
      ctx: Context,
    ) => {
      const authService = new AuthService(ctx.prisma);
      const result = await authService.signup(input);

      // Set refresh token as HTTP-only cookie
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return result;
    },

    login: async (
      _: unknown,
      { input }: { input: LoginInput },
      ctx: Context,
    ) => {
      const authService = new AuthService(ctx.prisma);
      const result = await authService.login(input);

      // Set refresh token as HTTP-only cookie
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return result;
    },

    refreshToken: async (_: unknown, __: unknown, ctx: Context) => {
      const refreshToken = ctx.req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new Error("No refresh token provided");
      }

      const authService = new AuthService(ctx.prisma);
      const result = await authService.refreshToken(refreshToken);

      // Set new refresh token as cookie
      ctx.res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: ctx.req.secure,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return result;
    },

    logout: async (_: unknown, __: unknown, ctx: Context) => {
      const refreshToken = ctx.req.cookies?.refreshToken;

      if (refreshToken) {
        const authService = new AuthService(ctx.prisma);
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      ctx.res.clearCookie("refreshToken");
      return true;
    },

    // Email verification mutations (placeholder for now)
    sendVerificationEmail: async (_: unknown, __: unknown, _ctx: Context) => {
      // TODO: Implement email verification
      return true;
    },

    verifyEmail: async (
      _: unknown,
      { token }: { token: string },
      _ctx: Context,
    ) => {
      // TODO: Implement email verification
      console.log("Email verification token:", token);
      return true;
    },

    // Password reset mutations (placeholder for now)
    forgotPassword: async (
      _: unknown,
      { email }: { email: string },
      _ctx: Context,
    ) => {
      // TODO: Implement password reset
      console.log("Password reset requested for:", email);
      return true;
    },

    resetPassword: async (
      _: unknown,
      { input }: { input: { token: string; newPassword: string } },
      _ctx: Context,
    ) => {
      // TODO: Implement password reset
      console.log("Password reset for token:", input.token);
      return true;
    },
  },
};
