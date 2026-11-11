import { z } from "zod";
import {
    INVALID_SIGNING_SECRET_MESSAGE,
    isValidSigningSecret
} from "~/api/utils/isValidSigningSecret.js";
import { isValidEndpointUrl } from "~/api/utils/isValidEndpointUrl.js";

export const CreateWebhookInputSchema = z.object({
    name: z.string().min(1, "Name is required."),
    slug: z.string().optional(),
    endpointUrl: z.string().refine(isValidEndpointUrl, {
        message: "Endpoint URL must use HTTPS and must not point to a local or link-local address."
    }),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string()).min(1, "At least one event must be selected."),
    signingSecret: z
        .string()
        .refine(isValidSigningSecret, { message: INVALID_SIGNING_SECRET_MESSAGE })
        .optional()
});
