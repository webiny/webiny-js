import { z } from "zod";

export const apiKeyInputSchema = z.object({
    name: z.string(),
    description: z.string(),
    permissions: z
        .array(z.object({ name: z.string() }).passthrough())
        .optional()
        .default([])
});

export const createApiKeyInputSchema = apiKeyInputSchema.extend({
    id: z.string().optional(),
    token: z
        .string()
        .optional()
        .refine(val => !val || val.startsWith("a"), {
            message: 'Token must start with letter "a"'
        })
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
