import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "warn" : "info");

const productionConfig = {
  level: logLevel,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "password",
      "token",
      "secret",
    ],
    censor: "[REDACTED]",
  },
};

const developmentConfig = {
  level: logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
};

export const logger = pino(
  isDevelopment ? developmentConfig : productionConfig,
);

export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

export const createUserLogger = (userId: string) => {
  return logger.child({ userId });
};

export const createOperationLogger = (
  operation: string,
  metadata?: Record<string, unknown>,
) => {
  return logger.child({ operation, ...metadata });
};
