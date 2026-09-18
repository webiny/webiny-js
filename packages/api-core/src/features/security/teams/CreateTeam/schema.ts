import { z } from "zod";

export const createTeamValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    // Nullable in the GraphQL schema - see `descriptionOnCreate` for why this is `.nullish()`.
    description: z.string().max(500).nullish(),
    roles: z.array(z.string())
});
