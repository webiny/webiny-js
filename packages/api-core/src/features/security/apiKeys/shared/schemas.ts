import { z } from "zod";

export const createApiKeyInputSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    // Nullable in the GraphQL schema - see `descriptionOnCreate` for why this is `.nullish()`.
    // This was a bare `z.string()`, so an API key created without a description was rejected
    // whether the client sent null or omitted the field entirely. `max` matches teams and roles.
    description: z.string().max(500).nullish(),
    permissions: z
        .array(z.looseObject({ name: z.string() }))
        .optional()
        .default([])
});

export const updateApiKeyInputSchema = z.object({
    name: z.string().min(1).optional(),
    // Nullable in the GraphQL schema - see `descriptionOnUpdate` for why this is `.nullish()` and
    // must not carry a `.transform()`. `max` matches teams and roles.
    description: z.string().max(500).nullish(),
    permissions: z
        .array(z.looseObject({ name: z.string() }))
        .optional()
        .default([])
});

export const listApiKeysInputSchema = z.object({
    where: z
        .object({
            name: z.string().optional(),
            name_contains: z.string().optional(),
            description: z.string().optional(),
            description_contains: z.string().optional()
        })
        .optional(),
    limit: z.number().int().positive().max(100).optional(),
    after: z.string().optional(),
    sort: z.array(z.enum(["createdOn_ASC", "createdOn_DESC"])).optional()
});
