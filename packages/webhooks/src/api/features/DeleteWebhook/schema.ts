import { z } from "zod";

export const DeleteWebhookInputSchema = z.object({
    id: z.string().min(1, "Webhook ID is required.")
});
