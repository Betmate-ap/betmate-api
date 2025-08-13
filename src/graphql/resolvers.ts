export const resolvers = {
  Query: {
    health: () => 'ok',
    // TEMP STUB: replace with Prisma after we add models
    me: (_: unknown, __: unknown, ctx: { user?: { userId: number } | null }) => {
      if (!ctx.user) return null;
      // Return a placeholder shape that matches the contract.
      // After Prisma models, we’ll fetch from the DB.
      return {
        id: ctx.user.userId,
        username: 'placeholder',
        firstName: 'Demo',
        lastName: 'User',
      };
    },
  },
};
