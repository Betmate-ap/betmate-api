export default async function globalTeardown() {
  console.log("Tearing down test environment...");

  // Any global cleanup can go here
  // For now, just log that we're done
  console.log("Test environment cleanup completed");
}
