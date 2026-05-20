import { z } from "zod";
import { isValidEndpointUrl } from "~/api/utils/isValidEndpointUrl.js";

export const CreateWebhookInputSchema = z.object({
    name: z.string().min(1, "Name is required."),
    slug: z.string().optional(),
    endpointUrl: z.string().refine(isValidEndpointUrl, {
        message: "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
    }),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string()).min(1, "At least one event must be selected."),
    signingSecret: z.string().optional()
});
