import { z } from "zod";

export const abortTaskSchema = z.object({
    id: z.string().min(1, "id is required"),
    message: z.string().optional()
});

export const triggerTaskSchema = z.object({
    definition: z.string().min(1, "definition is required"),
    input: z.record(z.string(), z.unknown()).optional()
});

export const listLogsSchema = z.object({
    where: z
        .object({
            task: z.string().optional()
        })
        .optional()
});
