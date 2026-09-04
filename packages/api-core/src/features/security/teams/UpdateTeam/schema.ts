import { z } from "zod";

export const updateTeamValidation = z.object({
    name: z.string().min(3).optional(),
    // Nullable in the GraphQL schema, so `null` is a legal input - and the admin app round-trips a
    // team's `description` straight from a read back into an update, so a team saved without one
    // sends `null` here. The use case maps it onto the empty string; an absent key still means
    // "leave unchanged".
    //
    // Note this must stay a plain `.nullish()` rather than carry a `.transform()`: a transform
    // makes the key REQUIRED in the inferred output type, so `{ ...existingTeam, ...parsed }`
    // would spread `description: undefined` over the stored value and wipe it on every partial
    // update.
    description: z.string().max(500).nullish(),
    roles: z.array(z.string()).optional()
});
