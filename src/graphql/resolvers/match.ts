import { MatchStatus } from "@prisma/client";
import { MatchService } from "../../services/match";
import { type Context, requireAuth } from "../context";

export const matchQueries = {
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
};
