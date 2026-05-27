import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { triggerWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface TriggerWebhookParams {
    id: string;
    payload: Record<string, unknown>;
}

export const triggerWebhook = createMethod(
    triggerWebhookSchema,
    async (config, fetchFn, { id, payload }) => {
        const query = `
        mutation TriggerWebhook($id: ID!, $payload: JSON!) {
            webhooks {
                triggerWebhook(id: $id, payload: $payload) {
                    data {
                        id
                        webhookId
                        backgroundTaskId
                        eventType
                        status
                        payload
                        requestHeaders
                        responseTime
                        responseStatus
                        responseBody
                        createdOn
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id, payload });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.triggerWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.triggerWebhook.error.message,
                    responseData.webhooks.triggerWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.triggerWebhook.data as WebhookDelivery);
    }
);
