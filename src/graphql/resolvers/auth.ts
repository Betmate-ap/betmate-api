import { GraphQLError } from "graphql";
import { AuthService } from "../../services/auth/auth.service";
import { ProfileService } from "../../services/auth/profile.service";
import type {
  SignupInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "../../services/auth";
import { type Context, requireAuth } from "../context";

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(ctx: Context, token: string): void {
  ctx.res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: ctx.req.secure,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export const authQueries = {
  me: async (_: unknown, __: unknown, ctx: Context) => {
    if (!ctx.user) return null;
    return new ProfileService(ctx.prisma).getUserById(ctx.user.userId);
  },
};

export const authMutations = {
  signup: async (
    _: unknown,
    { input }: { input: SignupInput },
    ctx: Context,
  ) => {
    const result = await new AuthService(ctx.prisma).signup(input);
    setRefreshCookie(ctx, result.refreshToken);
    return result;
  },

  login: async (_: unknown, { input }: { input: LoginInput }, ctx: Context) => {
    const result = await new AuthService(ctx.prisma).login(input);
    setRefreshCookie(ctx, result.refreshToken);
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
    setRefreshCookie(ctx, result.refreshToken);
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

  updateProfile: async (
    _: unknown,
    { input }: { input: UpdateProfileInput },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new ProfileService(ctx.prisma).updateProfile(userId, input);
  },

  changePassword: async (
    _: unknown,
    { input }: { input: ChangePasswordInput },
    ctx: Context,
  ) => {
    const userId = requireAuth(ctx);
    return new ProfileService(ctx.prisma).changePassword(userId, input);
  },
};
