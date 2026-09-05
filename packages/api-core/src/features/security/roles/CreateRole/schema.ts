import { z } from "zod";

export const createRoleValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    // Nullable in the GraphQL schema - see `descriptionOnCreate` for why this is `.nullish()`.
    // `.optional().default("")` did NOT cover this: Zod applies a default to `undefined` only, so
    // an explicit null still failed validation.
    description: z.string().max(500).nullish(),
    permissions: z.array(z.looseObject({ name: z.string() }))
});
