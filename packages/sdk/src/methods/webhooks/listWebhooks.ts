import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listWebhooksSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ListWebhooksParams {
    where?: {
        enabled?: boolean;
    };
    limit?: number;
    after?: string;
}

export interface ListWebhooksResult {
    data: Webhook[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export const listWebhooks = createMethod(
    listWebhooksSchema,
    async (config, fetchFn, { where, limit, after }) => {
        const query = `
        query ListWebhooks($where: ListWebhooksWhereInput, $limit: Int, $after: String) {
            webhooks {
                listWebhooks(where: $where, limit: $limit, after: $after) {
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

        const result = await executeGraphQL(config, fetchFn, query, { where, limit, after });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.listWebhooks.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.listWebhooks.error.message,
                    responseData.webhooks.listWebhooks.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.webhooks.listWebhooks.data,
            meta: responseData.webhooks.listWebhooks.meta
        } as ListWebhooksResult);
    }
);
