import { z } from "zod";

export const GetWebhookInputSchema = z.object({
    id: z.string().min(1, "Webhook ID is required.")
});
