import { z } from "zod";

const id = z.string().min(1, "id is required");
const fields = z.array(z.string().min(1)).min(1, "fields must contain at least one entry");
const json = z.record(z.string(), z.unknown());
const language = z.string().min(1).optional();

const pageInput = {
    properties: json.optional(),
    metadata: json.optional(),
    bindings: json.optional(),
    elements: json.optional(),
    extensions: json.optional()
};

export const getPageByIdSchema = z.object({ id, raw: z.boolean().optional(), fields });

export const getPageByPathSchema = z.object({
    path: z.string().min(1, "path is required"),
    fields
});

export const getPageRevisionsSchema = z.object({
    entryId: z.string().min(1, "entryId is required")
});

export const listPagesSchema = z.object({
    where: json.optional(),
    limit: z.number().int().positive().optional(),
    after: z.string().optional(),
    sort: z.array(z.string()).optional(),
    search: z.string().optional(),
    fields
});

export const createPageSchema = z.object({
    data: z.object({
        ...pageInput,
        location: z.object({ folderId: z.string().optional() }).optional()
    }),
    fields
});

export const updatePageSchema = z.object({ id, data: z.object(pageInput), fields });

export const pageActionSchema = z.object({ id, fields });

export const deletePageSchema = z.object({ id, permanently: z.boolean().optional() });

export const getGlobalComponentSchema = z.object({
    name: z.string().min(1, "name is required"),
    language
});

export const listGlobalComponentsSchema = z.object({
    language,
    fallback: z.boolean().optional()
});

export const saveGlobalComponentSchema = z.object({
    name: z.string().min(1, "name is required"),
    language,
    data: z.object({ elements: json, bindings: json })
});
