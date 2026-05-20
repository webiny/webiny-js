import { z } from "zod";

export const UpdateWebhookSettingsInputSchema = z.object({
    signingSecret: z.string().optional()
});
