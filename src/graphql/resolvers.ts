import { PrismaClient } from "@prisma/client";

type Context = {
  user?: { userId: number } | null;
  prisma: PrismaClient;
};

export const resolvers = {
  Query: {
    health: () => "ok",
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.userId },
      });

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      };
    },
  },
};
