import { readFileSync } from "fs";
import path from "path";

// Load SDL from the installed contracts package
export function loadContractsSDL(): string {
  try {
    // Try to resolve the package first, then construct the path
    const packagePath = require.resolve("@betmate-ap/contracts/package.json");
    const contractsDir = path.dirname(packagePath);
    const schemaPath = path.join(
      contractsDir,
      "src",
      "schema",
      "index.graphql",
    );
    return readFileSync(schemaPath, "utf8");
  } catch (error) {
    // Fallback: try direct require.resolve
    try {
      const schemaPath = require.resolve(
        "@betmate-ap/contracts/src/schema/index.graphql",
      );
      return readFileSync(schemaPath, "utf8");
    } catch (fallbackError) {
      throw new Error(
        `Failed to load GraphQL schema from @betmate-ap/contracts. ` +
          `Original error: ${error.message}. ` +
          `Fallback error: ${fallbackError.message}`,
      );
    }
  }
}
