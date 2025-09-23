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

    // Only accept access tokens for authentication
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
  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies (fallback)
  return req.cookies?.accessToken;
}
