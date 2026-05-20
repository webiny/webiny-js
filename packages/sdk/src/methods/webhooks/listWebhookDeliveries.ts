import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listWebhookDeliveriesSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ListWebhookDeliveriesWhere {
    webhookId_eq?: string;
    eventType_in?: string[];
    status_in?: string[];
}

export interface ListWebhookDeliveriesParams {
    where?: ListWebhookDeliveriesWhere;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDelivery[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export const listWebhookDeliveries = createMethod(
    listWebhookDeliveriesSchema,
    async (config, fetchFn, { where, limit, after }) => {
        const query = `
        query ListWebhookDeliveries($where: WebhookDeliveryListWhereInput, $limit: Int, $after: String) {
            webhooks {
                listWebhookDeliveries(where: $where, limit: $limit, after: $after) {
                    data {
                        id
                        webhookId
                        backgroundTaskId
                        eventType
                        status
                        payload
                        requestHeaders
                        responseHeaders
                        responseTime
                        responseStatus
                        responseBody
                        expiresAt
                        createdOn
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, {
            where,
            limit,
            after
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.listWebhookDeliveries.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.listWebhookDeliveries.error.message,
                    responseData.webhooks.listWebhookDeliveries.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.webhooks.listWebhookDeliveries.data,
            meta: responseData.webhooks.listWebhookDeliveries.meta
        } as ListWebhookDeliveriesResult);
    }
);
