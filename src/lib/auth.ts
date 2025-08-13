import jwt from 'jsonwebtoken';

export type AuthUser = { userId: number } | null;

export function getUserFromToken(token: string | undefined): AuthUser {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
