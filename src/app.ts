import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import {
  GraphQLError,
  Kind,
  type ValidationRule,
  type ASTVisitor,
  type DocumentNode,
} from "graphql";
import { createComplexityLimitRule } from "graphql-validation-complexity";
import { loadContractsSDL } from "./graphql/loadSchema";
import { resolvers } from "./graphql/resolvers";
import { prisma } from "./lib/prisma";
import { getUserFromToken, extractTokenFromRequest } from "./lib/auth";
import { logger } from "./lib/logger";
import { config } from "./lib/config";

export async function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";

  // Trust reverse proxies (Cloud Run/Nginx/etc.)
  app.set("trust proxy", 1);

  // Secure headers (relax CSP in dev so Apollo Sandbox can load)
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // Structured HTTP logs with request-id
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = (req.headers["x-request-id"] as string) || undefined;
        const id = existing ?? randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  // CORS
  const devOrigins = ["http://localhost:5173", "http://localhost:4000"];
  app.use(
    cors({
      origin: isProd ? config.CORS_ORIGIN : devOrigins,
      credentials: true,
    }),
  );

  // Body & cookies
  app.use(express.json());
  app.use(cookieParser());

  // Rate limit (100 requests / 15 minutes per IP)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/healthz", limiter);
  app.use("/readyz", limiter);
  app.use("/livez", limiter);
  app.use("/graphql", limiter);

  // ----- Apollo / GraphQL -----
  const typeDefs = loadContractsSDL();

  // Complexity guard (acts as depth/complexity limit)
  const complexityRule = createComplexityLimitRule(250, {
    onCost: (cost: number) => logger.info({ cost }, "graphql query cost"),
    formatErrorMessage: (cost: number) =>
      `Query is too complex: ${Math.round(cost)} (max 250)`,
  });

  // Helper: detect introspection operation
  const isIntrospectionOp = (doc: DocumentNode) =>
    doc.definitions.some((def) => {
      if (def.kind !== Kind.OPERATION_DEFINITION) return false;
      return def.selectionSet.selections.some(
        (sel) =>
          sel.kind === Kind.FIELD &&
          (sel.name.value === "__schema" || sel.name.value === "__type"),
      );
    });

  // Validation rule that *skips* complexity for introspection
  const skipOnIntrospection: ValidationRule = (context) => {
    if (isIntrospectionOp(context.getDocument())) {
      return {} as unknown as ASTVisitor;
    }
    // Delegate to the real complexity rule
    return (complexityRule as unknown as ValidationRule)(context);
  };

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: !isProd,
    plugins: isProd
      ? []
      : [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    validationRules: [skipOnIntrospection],
    formatError(formattedErr, rawErr) {
      logger.error({ err: rawErr }, "graphql error");

      if (isProd) {
        const isInternal =
          formattedErr.extensions?.code === "INTERNAL_SERVER_ERROR" ||
          formattedErr.message.includes("Unexpected");
        if (isInternal) {
          return new GraphQLError("Internal server error", {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
      }
      return formattedErr;
    },
  });

  await apollo.start();

  app.use(
    "/graphql",
    expressMiddleware(apollo, {
      context: async ({ req, res }) => {
        const token = extractTokenFromRequest(req);
        const user = getUserFromToken(token);
        return { req, res, prisma, user };
      },
    }),
  );

  // Health endpoints
  app.get("/health", (_req, res) => res.send("ok"));
  app.get("/healthz", (_req, res) => res.send("ok"));

  // Readiness: check database connection
  app.get("/readyz", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
        },
      });
    } catch (error) {
      logger.error(error, "readiness check failed");
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Enhanced health check with metrics
  app.get("/health/detailed", async (_req, res) => {
    try {
      const { HealthChecker, monitor } = await import("./lib/monitoring");

      const [dbHealth, memoryHealth] = await Promise.all([
        HealthChecker.checkDatabase(),
        HealthChecker.checkMemoryUsage(),
      ]);

      const systemInfo = HealthChecker.getSystemInfo();
      const metrics = monitor.getMetrics();

      const overallHealthy = dbHealth.healthy && memoryHealth.healthy;

      res.status(overallHealthy ? 200 : 503).json({
        status: overallHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth,
          memory: memoryHealth,
          system: systemInfo,
        },
        metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      });
    } catch (error) {
      logger.error(error, "detailed health check failed");
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Liveness: basic app health (should be lightweight)
  app.get("/livez", (_req, res) => {
    res.status(200).send("alive");
  });

  return app;
}
