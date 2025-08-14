type AppConfig = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  COOKIE_SECURE: boolean; // true in prod
  COOKIE_SAMESITE: "lax" | "none";
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`[config] Missing required env: ${name}`);
  }
  return v;
}

function parseNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) {
    throw new Error(`[config] ${name} must be a number, got: ${raw}`);
  }
  return n;
}

const NODE_ENV = (process.env.NODE_ENV ||
  "development") as AppConfig["NODE_ENV"];

// Required
const DATABASE_URL = requireEnv("DATABASE_URL");
const JWT_SECRET = requireEnv("JWT_SECRET");

// Optional with safe defaults
const PORT = parseNumber("PORT", 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Cookies: secure in prod; SameSite "none" only when secure=true (for cross-site)
const COOKIE_SECURE = NODE_ENV === "production";
const COOKIE_SAMESITE: AppConfig["COOKIE_SAMESITE"] = COOKIE_SECURE
  ? "none"
  : "lax";

export const config: AppConfig = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  CORS_ORIGIN,
  COOKIE_SECURE,
  COOKIE_SAMESITE,
};
