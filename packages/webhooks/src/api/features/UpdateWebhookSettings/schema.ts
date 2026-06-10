import { z } from "zod";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

export const UpdateWebhookSettingsInputSchema = z.object({
    signingSecret: z.string().optional(),
    deliveryRetentionDays: z
        .number()
        .int()
        .min(0)
        .max(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
        .optional()
});
