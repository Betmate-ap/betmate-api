import { PrismaClient, BetStatus, MatchStatus } from "@prisma/client";
import { GraphQLError } from "graphql";
import { POINTS_STAKE } from "../../constants/bet";

export class ResolutionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Settles all TEAMS_LOCKED bets for a match and expires any incomplete ones.
   * Pass null as winnerTeam to cancel the match (e.g. rain abandonment).
   */
  async resolveMatch(matchId: string, winnerTeam: string | null) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new GraphQLError("Match not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (
      match.status === MatchStatus.COMPLETED ||
      match.status === MatchStatus.CANCELLED
    ) {
      throw new GraphQLError("Match is already resolved", {
        extensions: { code: "ALREADY_RESOLVED" },
      });
    }

    if (
      winnerTeam &&
      winnerTeam !== match.team1 &&
      winnerTeam !== match.team2
    ) {
      throw new GraphQLError(
        `Winner must be "${match.team1}" or "${match.team2}"`,
        {
          extensions: { code: "INVALID_TEAM" },
        },
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const expiredResult = await tx.bet.updateMany({
        where: {
          matchId,
          status: {
            in: [BetStatus.PENDING, BetStatus.ACCEPTED, BetStatus.TOSS_DONE],
          },
        },
        data: { status: BetStatus.EXPIRED },
      });

      if (!winnerTeam) {
        const cancelledResult = await tx.bet.updateMany({
          where: { matchId, status: BetStatus.TEAMS_LOCKED },
          data: { status: BetStatus.CANCELLED },
        });
        await tx.match.update({
          where: { id: matchId },
          data: { status: MatchStatus.CANCELLED },
        });
        return {
          settled: 0,
          cancelled: cancelledResult.count,
          expired: expiredResult.count,
        };
      }

      const bets = await tx.bet.findMany({
        where: { matchId, status: BetStatus.TEAMS_LOCKED },
      });

      for (const bet of bets) {
        const challengerWon = bet.challengerPick === winnerTeam;
        const winnerId = challengerWon ? bet.challengerId : bet.challengeeId;
        const loserId = challengerWon ? bet.challengeeId : bet.challengerId;

        await tx.bet.update({
          where: { id: bet.id },
          data: { status: BetStatus.COMPLETED, winnerId },
        });
        await tx.user.update({
          where: { id: winnerId },
          data: { points: { increment: POINTS_STAKE } },
        });
        await tx.user.update({
          where: { id: loserId },
          data: { points: { decrement: POINTS_STAKE } },
        });
      }

      await tx.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.COMPLETED, winnerTeam },
      });

      return {
        settled: bets.length,
        cancelled: 0,
        expired: expiredResult.count,
      };
    });
  }
}
