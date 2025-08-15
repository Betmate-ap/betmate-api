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
import { loadContractsSDL } from "./graphql/loadSchema";
import { resolvers } from "./graphql/resolvers";
import { prisma } from "./lib/prisma";
import { getUserFromToken } from "./lib/auth";
import { logger } from "./lib/logger";
import { config } from "./lib/config";

export async function createApp() {
  const app = express();

  // Behind proxies (Cloud Run, Nginx, etc.) trust X-Forwarded-* headers
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      // Apollo Sandbox loads scripts from a CDN; disable CSP in dev so the landing page works.
      // In production we keep CSP ON (default).
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );

  // Structured request logs with request-id
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = (req.headers["x-request-id"] as string) || undefined;
        const id = existing ?? randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  // CORS (from env)
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));

  // Body & cookies
  app.use(express.json());
  app.use(cookieParser());

  // Basic rate limit (100 requests / 15 minutes per IP)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/healthz", limiter);
  app.use("/graphql", limiter);

  // Apollo
  const typeDefs = loadContractsSDL();
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await apollo.start();

  app.use(
    "/graphql",
    expressMiddleware(apollo, {
      context: async ({ req, res }) => {
        const token = req.cookies?.token as string | undefined;
        const user = getUserFromToken(token);
        return { req, res, prisma, user, config };
      },
    }),
  );

  app.get("/healthz", (_req, res) => res.send("ok"));
  return app;
}
