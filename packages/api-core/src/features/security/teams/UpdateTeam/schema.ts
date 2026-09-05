import { z } from "zod";

export const updateTeamValidation = z.object({
    name: z.string().min(3).optional(),
    // Nullable in the GraphQL schema - see `descriptionOnUpdate` for why this is `.nullish()` and
    // must not carry a `.transform()`.
    description: z.string().max(500).nullish(),
    roles: z.array(z.string()).optional()
});
