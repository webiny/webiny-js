import { z } from "zod";

export const ListWebhookDeliveriesInputSchema = z.object({
    where: z.record(z.string(), z.unknown()).optional(),
    limit: z.number().int().positive("Limit must be a positive integer.").optional(),
    after: z.string().optional(),
    sort: z.array(z.string()).optional()
});
