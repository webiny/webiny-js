import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { getWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface GetWebhookParams {
    id: string;
}

export const getWebhook = createMethod(getWebhookSchema, async (config, fetchFn, { id }) => {
    const query = `
        query GetWebhook($id: ID!) {
            webhooks {
                getWebhook(id: $id) {
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

    const result = await executeGraphQL(config, fetchFn, query, { id });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.webhooks.getWebhook.error) {
        return Result.fail(
            new ApiError(
                responseData.webhooks.getWebhook.error.message,
                responseData.webhooks.getWebhook.error.code
            )
        );
    }

    return Result.ok(responseData.webhooks.getWebhook.data as Webhook);
});
