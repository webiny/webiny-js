import { z } from "zod";
import { isValidEndpointUrl } from "~/api/utils/isValidEndpointUrl.js";

export const UpdateWebhookInputSchema = z.object({
    name: z.string().min(1, "Name must not be empty.").optional(),
    endpointUrl: z
        .string()
        .refine(isValidEndpointUrl, {
            message: "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
        })
        .optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string()).min(1, "At least one event must be selected.").optional(),
    signingSecret: z.string().optional()
});
