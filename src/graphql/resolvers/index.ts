import { authQueries, authMutations } from "./auth";
import { friendQueries, friendMutations } from "./friend";
import { matchQueries } from "./match";
import { betQueries, betMutations } from "./bet";

export const resolvers = {
  Query: {
    health: () => "ok",
    ...authQueries,
    ...friendQueries,
    ...matchQueries,
    ...betQueries,
  },
  Mutation: {
    ...authMutations,
    ...friendMutations,
    ...betMutations,
  },
};
