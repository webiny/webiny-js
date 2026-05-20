import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { getWebhookDeliverySchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface GetWebhookDeliveryParams {
    id: string;
}

export const getWebhookDelivery = createMethod(
    getWebhookDeliverySchema,
    async (config, fetchFn, { id }) => {
        const query = `
        query GetWebhookDelivery($id: ID!) {
            webhooks {
                getWebhookDelivery(id: $id) {
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
                        expiresAt
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

        const result = await executeGraphQL(config, fetchFn, query, { id });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.getWebhookDelivery.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.getWebhookDelivery.error.message,
                    responseData.webhooks.getWebhookDelivery.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.getWebhookDelivery.data as WebhookDelivery);
    }
);
