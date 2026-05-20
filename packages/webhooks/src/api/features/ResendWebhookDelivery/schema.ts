import { z } from "zod";

export const ResendWebhookDeliveryInputSchema = z.object({
    deliveryId: z.string().min(1, "Delivery ID is required.")
});
