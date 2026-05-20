import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { updateWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface UpdateWebhookParams {
    id: string;
    name?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
}

export const updateWebhook = createMethod(
    updateWebhookSchema,
    async (config, fetchFn, { id, ...input }) => {
        const query = `
        mutation UpdateWebhook($id: ID!, $input: UpdateWebhookInput!) {
            webhooks {
                updateWebhook(id: $id, input: $input) {
                    data {
                        id
                        name
                        slug
                        endpointUrl
                        description
                        enabled
                        events
                        signingSecret
                        createdOn
                        modifiedOn
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id, input });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.updateWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.updateWebhook.error.message,
                    responseData.webhooks.updateWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.updateWebhook.data as Webhook);
    }
);
