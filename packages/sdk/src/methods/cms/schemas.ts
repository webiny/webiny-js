import { z } from "zod";

const modelId = z.string().min(1, "modelId is required");
const revisionId = z.string().min(1, "revisionId is required");
const fields = z.array(z.string().min(1)).min(1, "fields must contain at least one entry");
const where = z.record(z.string(), z.unknown()).optional();
const preview = z.boolean().optional();

export const listEntriesSchema = z.object({
    modelId,
    where,
    sort: z.record(z.string(), z.union([z.literal("asc"), z.literal("desc")])).optional(),
    limit: z.number().int().positive().optional(),
    after: z.string().optional(),
    search: z.string().optional(),
    fields,
    preview
});

export const getEntrySchema = z.object({
    modelId,
    where: z.record(z.string(), z.unknown()),
    fields,
    preview
});

export const createEntrySchema = z.object({
    modelId,
    data: z.record(z.string(), z.unknown()),
    fields
});

export const updateEntryRevisionSchema = z.object({
    modelId,
    revisionId,
    data: z.record(z.string(), z.unknown()),
    fields
});

export const publishEntryRevisionSchema = z.object({
    modelId,
    revisionId,
    fields
});

export const unpublishEntryRevisionSchema = z.object({
    modelId,
    revisionId,
    fields
});

export const deleteEntryRevisionSchema = z.object({
    modelId,
    revisionId,
    permanent: z.boolean().optional()
});
