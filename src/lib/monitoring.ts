import { logger } from "./logger";

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  recordMetric(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    const values = this.metrics.get(metric)!;
    values.push(value);

    // Keep only last 100 values to prevent memory leak
    if (values.length > 100) {
      values.shift();
    }

    // Log slow operations
    if (metric.includes("graphql") && value > 1000) {
      logger.warn(
        { metric, duration: value },
        "Slow GraphQL operation detected",
      );
    }
    if (metric.includes("database") && value > 500) {
      logger.warn(
        { metric, duration: value },
        "Slow database operation detected",
      );
    }
  }

  getMetrics(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const result: Record<
      string,
      { avg: number; min: number; max: number; count: number }
    > = {};

    for (const [metric, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[metric] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return result;
  }

  logMetricsSummary(): void {
    const metrics = this.getMetrics();
    logger.info({ metrics }, "Performance metrics summary");
  }
}

// Health check utilities
export class HealthChecker {
  static async checkDatabase(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const { prisma } = await import("./prisma");
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return { healthy: true, latency };
    } catch (error) {
      logger.error({ error }, "Database health check failed");
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async checkMemoryUsage(): Promise<{
    healthy: boolean;
    usage: NodeJS.MemoryUsage;
    warning?: string;
  }> {
    const usage = process.memoryUsage();
    const maxHeapMB = 512; // Alert if heap exceeds 512MB
    const heapMB = usage.heapUsed / 1024 / 1024;

    const healthy = heapMB < maxHeapMB;
    const warning = healthy
      ? undefined
      : `High memory usage: ${heapMB.toFixed(2)}MB`;

    if (!healthy) {
      logger.warn({ usage, heapMB }, "High memory usage detected");
    }

    return { healthy, usage, warning };
  }

  static getSystemInfo(): {
    nodeVersion: string;
    platform: string;
    uptime: number;
    environment: string;
  } {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
    };
  }
}

// Error tracking
export class ErrorTracker {
  static trackError(error: Error, context?: Record<string, unknown>): void {
    logger.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
      },
      "Error tracked",
    );

    // In production, you might want to send to external service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to Sentry, DataDog, etc.
    }
  }

  static trackGraphQLError(
    error: Error,
    query?: string,
    variables?: Record<string, unknown>,
  ): void {
    this.trackError(error, {
      type: "graphql",
      query: query?.slice(0, 200), // Truncate long queries
      variables: variables ? Object.keys(variables) : undefined,
    });
  }
}

// Initialize monitoring
const monitor = PerformanceMonitor.getInstance();

// Log metrics summary every 5 minutes in production
if (process.env.NODE_ENV === "production") {
  setInterval(
    () => {
      monitor.logMetricsSummary();
    },
    5 * 60 * 1000,
  );
}

export { monitor };
