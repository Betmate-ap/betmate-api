import { prisma } from "../../lib/prisma";
import { config } from "../../lib/config";
import { CricketDataProvider } from "./cricketDataProvider";
import { MockCricketProvider } from "./mockProvider";
import { CricketSyncService } from "./syncService";

export function createCricketSyncService(): CricketSyncService {
  const isProduction =
    config.NODE_ENV === "production" || config.NODE_ENV === "staging";

  const provider = isProduction
    ? new CricketDataProvider(
        config.CRICKET_API_KEY!,
        config.CRICKET_IPL_SERIES_ID!,
      )
    : new MockCricketProvider();

  return new CricketSyncService(provider, prisma);
}

export type { CricketProvider, ExternalMatch } from "./types";
export { MockCricketProvider } from "./mockProvider";
export { CricketDataProvider } from "./cricketDataProvider";
export { CricketSyncService } from "./syncService";
