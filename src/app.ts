import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { loadContractsSDL } from "./graphql/loadSchema";
import { resolvers } from "./graphql/resolvers";
import { prisma } from "./lib/prisma";
import { getUserFromToken } from "./lib/auth";
import { config } from "./lib/config";

export async function createApp() {
  const app = express();

  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  const typeDefs = loadContractsSDL();
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  app.use(
    "/graphql",
    expressMiddleware(apollo, {
      context: async ({ req, res }) => {
        const token = req.cookies?.token as string | undefined;
        const user = getUserFromToken(token);
        return { req, res, prisma, user, config }; // expose config if resolvers need cookie opts later
      },
    }),
  );

  app.get("/healthz", (_req, res) => res.send("ok"));
  return app;
}
