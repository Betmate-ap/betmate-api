import { PrismaClient, MatchStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

export class MatchService {
  constructor(private prisma: PrismaClient) {}

  /** Returns all matches, optionally filtered by status. */
  async getMatches(status?: MatchStatus) {
    return this.prisma.match.findMany({
      where: status ? { status } : undefined,
      orderBy: { scheduledAt: "asc" },
    });
  }

  /** Returns a single match by ID. Throws if not found. */
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
