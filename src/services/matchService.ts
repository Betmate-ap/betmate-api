import { PrismaClient, MatchStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

export class MatchService {
  constructor(private prisma: PrismaClient) {}

  async getMatches(status?: MatchStatus) {
    return this.prisma.match.findMany({
      where: status ? { status } : undefined,
      orderBy: { scheduledAt: "asc" },
    });
  }

  async getMatch(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });

    if (!match) {
      throw new GraphQLError("Match not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return match;
  }
}
