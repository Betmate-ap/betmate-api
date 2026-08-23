import { logger } from "./logger";
import { config } from "./config";
import type { CricketSyncService } from "../services/cricket";

// Poll every 15 min in prod (96 calls/day, within free tier).
// Poll every 1 min in dev so mock scenarios are exercised quickly.
const INTERVAL_MS =
  config.NODE_ENV === "production" || config.NODE_ENV === "staging"
    ? 15 * 60 * 1000
    : 60 * 1000;

export function startCricketScheduler(syncService: CricketSyncService): void {
  const run = () => {
    syncService.sync().catch((err) => {
      logger.error({ err }, "cricket-scheduler: unhandled sync error");
    });
  };

  // Run immediately on startup, then on each interval
  run();
  const timer = setInterval(run, INTERVAL_MS);

  // Don't keep the process alive just for the scheduler
  timer.unref();

  logger.info(
    { intervalMs: INTERVAL_MS, env: config.NODE_ENV },
    "cricket-scheduler: started",
  );
}
