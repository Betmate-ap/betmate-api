import { readFileSync } from "fs";

// Load SDL from the installed contracts package
export function loadContractsSDL(): string {
  const schemaPath = require.resolve(
    "@betmate-ap/contracts/src/schema/index.graphql",
  );
  return readFileSync(schemaPath, "utf8");
}
