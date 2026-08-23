import { MatchStatus, type PrismaClient } from "@prisma/client";
import { logger } from "../../lib/logger";
import { BetService } from "../betService";
import type { CricketProvider, ExternalMatch } from "./types";

export class CricketSyncService {
  private readonly betService: BetService;

  constructor(
    private readonly provider: CricketProvider,
    private readonly prisma: PrismaClient,
  ) {
    this.betService = new BetService(prisma);
  }

  async sync(): Promise<void> {
    let matches: ExternalMatch[];
    try {
      matches = await this.provider.getIPLMatches();
    } catch (err) {
      logger.error({ err }, "cricket-sync: failed to fetch matches");
      return;
    }

    logger.info({ count: matches.length }, "cricket-sync: processing matches");

    for (const m of matches) {
      try {
        await this.processMatch(m);
      } catch (err) {
        logger.error(
          { err, externalId: m.externalId },
          "cricket-sync: error processing match",
        );
      }
    }
  }

  private async processMatch(m: ExternalMatch): Promise<void> {
    const existing = await this.prisma.match.findFirst({
      where: { externalId: m.externalId },
    });

    // Already fully resolved — nothing left to do
    if (
      existing?.status === MatchStatus.COMPLETED ||
      existing?.status === MatchStatus.CANCELLED
    ) {
      return;
    }

    if (m.matchEnded) {
      await this.resolveMatch(m, existing?.id);
      return;
    }

    if (!existing) {
      // New upcoming match — create it
      await this.prisma.match.create({
        data: {
          externalId: m.externalId,
          team1: m.team1,
          team2: m.team2,
          venue: m.venue,
          tournament: "IPL",
          scheduledAt: new Date(m.dateTimeGMT),
          status: MatchStatus.UPCOMING,
        },
      });
      logger.info(
        { externalId: m.externalId, name: m.name },
        "cricket-sync: match created",
      );
      return;
    }

    if (m.matchStarted && existing.status === MatchStatus.UPCOMING) {
      await this.prisma.match.update({
        where: { id: existing.id },
        data: { status: MatchStatus.LIVE },
      });
      logger.info({ externalId: m.externalId }, "cricket-sync: match → LIVE");
    }
  }

  private async resolveMatch(
    m: ExternalMatch,
    existingId?: string,
  ): Promise<void> {
    let matchId = existingId;

    // Edge case: match completed before we ever saw it as upcoming
    if (!matchId) {
      const created = await this.prisma.match.create({
        data: {
          externalId: m.externalId,
          team1: m.team1,
          team2: m.team2,
          venue: m.venue,
          tournament: "IPL",
          scheduledAt: new Date(m.dateTimeGMT),
          status: MatchStatus.UPCOMING,
        },
      });
      matchId = created.id;
    }

    const winner = parseWinner(m.status, [m.team1, m.team2]);
    const result = await this.betService.resolveMatch(matchId, winner);
    logger.info(
      { externalId: m.externalId, winner, ...result },
      "cricket-sync: match resolved",
    );
  }
}

function parseWinner(status: string, teams: [string, string]): string | null {
  const lower = status.toLowerCase();
  for (const team of teams) {
    if (lower.startsWith(team.toLowerCase())) return team;
  }
  return null;
}
