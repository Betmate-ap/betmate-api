import jwt from "jsonwebtoken";
import { config } from "./config";

export type AuthUser = { userId: string } | null;

export function getUserFromToken(token: string | undefined): AuthUser {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (payload.type !== "access") {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(req: {
  headers: { authorization?: string };
  cookies?: { accessToken?: string };
}): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return req.cookies?.accessToken;
}
