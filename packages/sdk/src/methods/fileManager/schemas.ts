import { z } from "zod";

const fields = z.array(z.string().min(1)).min(1, "fields must contain at least one entry");
const where = z.record(z.string(), z.unknown()).optional();

export const listFilesSchema = z.object({
    search: z.string().optional(),
    where,
    limit: z.number().int().positive().optional(),
    after: z.string().optional(),
    sort: z.array(z.string()).optional(),
    fields
});

export const getFileSchema = z.object({
    id: z.string().min(1, "id is required"),
    fields
});

export const updateFileSchema = z.object({
    id: z.string().min(1, "id is required"),
    data: z.record(z.string(), z.unknown()),
    fields
});
