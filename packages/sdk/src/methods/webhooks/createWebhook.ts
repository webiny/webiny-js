import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { createWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface CreateWebhookParams {
    name: string;
    endpointUrl: string;
    events: string[];
    slug?: string;
    description?: string;
    enabled?: boolean;
}

export const createWebhook = createMethod(createWebhookSchema, async (config, fetchFn, params) => {
    const query = `
        mutation CreateWebhook($input: CreateWebhookInput!) {
            webhooks {
                createWebhook(input: $input) {
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

    const result = await executeGraphQL(config, fetchFn, query, { input: params });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.webhooks.createWebhook.error) {
        return Result.fail(
            new ApiError(
                responseData.webhooks.createWebhook.error.message,
                responseData.webhooks.createWebhook.error.code
            )
        );
    }

    return Result.ok(responseData.webhooks.createWebhook.data as Webhook);
});
