// Initialize Sentry first (before any other imports)
import { initSentry } from "./lib/sentry";
initSentry();

import { createApp } from "./app";
import { logger } from "./lib/logger";
import { config } from "./lib/config";
import { startCricketScheduler } from "./lib/cricketScheduler";
import { createCricketSyncService } from "./services/cricket";

const PORT = Number(process.env.PORT || 4000);

createApp()
  .then((app) => {
    app.listen(PORT, () =>
      logger.info(`GraphQL API: http://localhost:${PORT}/graphql`),
    );

    // Don't run the scheduler during tests
    if (config.NODE_ENV !== "test") {
      startCricketScheduler(createCricketSyncService());
    }
  })
  .catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    process.stderr.write(
      `\n[FATAL] Failed to start server: ${message}\n${stack}\n\n`,
    );
    logger.error(err, "Failed to start server");
    process.exit(1);
  });
