import { z } from "zod";

export const createApiKeyInputSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string(),
    permissions: z
        .array(z.looseObject({ name: z.string() }))
        .optional()
        .default([])
});

export const updateApiKeyInputSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
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
