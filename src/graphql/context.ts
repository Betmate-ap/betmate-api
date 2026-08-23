import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import type { Request, Response } from "express";

export type Context = {
  user?: { userId: string } | null;
  prisma: PrismaClient;
  req: Request;
  res: Response;
};

export function requireAuth(ctx: Context): string {
  if (!ctx.user?.userId) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.user.userId;
}
