import { z } from "zod";

export const TriggerWebhookInputSchema = z.object({
    webhookId: z.string().min(1, "Webhook ID is required."),
    payload: z.record(z.string(), z.unknown())
});
