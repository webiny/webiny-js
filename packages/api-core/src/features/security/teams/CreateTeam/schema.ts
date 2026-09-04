import { z } from "zod";

export const createTeamValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    // `description` is nullable in the GraphQL schema (`description: String`), so clients are free
    // to send `null`. Zod's `.optional()` accepts only `undefined`, so those requests failed with
    // "Invalid input: expected string, received null". Accept both and let the use case map them
    // onto the empty string the domain type uses for "no description".
    description: z.string().max(500).nullish(),
    roles: z.array(z.string())
});
