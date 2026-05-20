import { z } from "zod";

export const GetWebhookDeliveryInputSchema = z.object({
    id: z.string().min(1, "Delivery ID is required.")
});
