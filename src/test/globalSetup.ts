import { PrismaClient } from "@prisma/client";

export default async function globalSetup() {
  console.log("Setting up test environment...");

  // Ensure test database is ready
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          "postgresql://postgres:postgres@localhost:5432/betmate_test",
      },
    },
  });

  try {
    // Test database connection
    await prisma.$connect();
    console.log("Test database connection established");

    // Run migrations if needed
    // Note: In CI, migrations should be run before tests
    // This is just a fallback for local development
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
