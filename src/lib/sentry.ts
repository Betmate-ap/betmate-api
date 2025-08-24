import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "./logger";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || "development";

  if (!dsn) {
    logger.info("Sentry DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [nodeProfilingIntegration(), Sentry.httpIntegration()],
    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Don't capture console.log as breadcrumbs (we have pino)
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console") {
        return null;
      }
      return breadcrumb;
    },
  });

  logger.info({ environment }, "Sentry initialized");
}
