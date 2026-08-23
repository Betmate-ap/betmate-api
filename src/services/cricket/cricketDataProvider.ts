import { logger } from "../../lib/logger";
import type { CricketProvider, ExternalMatch } from "./types";

// CricAPI v1 response shapes (minimal — only fields we use)
interface CricApiMatchEntry {
  id: string;
  name: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  venue: string;
  matchStarted: boolean;
  matchEnded: boolean;
  status: string;
}

interface CricApiSeriesInfoResponse {
  status: string;
  data?: {
    info?: { name: string };
    matchList?: CricApiMatchEntry[];
  };
  reason?: string;
}

export class CricketDataProvider implements CricketProvider {
  private readonly baseUrl = "https://api.cricketdata.org/v1";

  constructor(
    private readonly apiKey: string,
    private readonly iplSeriesId: string,
  ) {}

  async getIPLMatches(): Promise<ExternalMatch[]> {
    const url = `${this.baseUrl}/series_info?apikey=${this.apiKey}&id=${this.iplSeriesId}`;

    let body: CricApiSeriesInfoResponse;
    try {
      const res = await fetch(url);
      body = (await res.json()) as CricApiSeriesInfoResponse;
    } catch (err) {
      logger.error({ err }, "cricket-api: network error fetching IPL matches");
      return [];
    }

    if (body.status !== "success") {
      logger.warn({ reason: body.reason }, "cricket-api: non-success response");
      return [];
    }

    const matchList = body.data?.matchList ?? [];
    return matchList
      .filter((m) => m.teams.length === 2)
      .map((m) => ({
        externalId: m.id,
        name: m.name,
        team1: m.teams[0],
        team2: m.teams[1],
        venue: m.venue ?? "",
        dateTimeGMT: m.dateTimeGMT,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        status: m.status,
      }));
  }
}
