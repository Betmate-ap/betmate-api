import { PrismaClient } from "@prisma/client";

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/betmate_test";
  process.env.JWT_SECRET = "test-secret";
});

beforeEach(async () => {
  // Clean up database before each test
  const prisma = new PrismaClient();

  try {
    // Get all table names and clean them
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    for (const table of tables) {
      if (table.tablename !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table.tablename}" CASCADE;`,
        );
      }
    }
  } catch (error) {
    console.warn("Database cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
});

afterAll(async () => {
  // Final cleanup
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});
