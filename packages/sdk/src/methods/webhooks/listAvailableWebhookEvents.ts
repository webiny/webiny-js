import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError } from "../../errors.js";
import type { NetworkError } from "../../errors.js";
import type { WebhookEvent } from "./webhooksTypes.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export async function listAvailableWebhookEvents(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<WebhookEvent[], HttpError | ApiError | NetworkError>> {
    const query = `
        query ListAvailableWebhookEvents {
            webhooks {
                listAvailableWebhookEvents {
                    data {
                        app
                        appLabel
                        entity
                        eventName
                        label
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {});

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.webhooks.listAvailableWebhookEvents.error) {
        return Result.fail(
            new ApiError(
                responseData.webhooks.listAvailableWebhookEvents.error.message,
                responseData.webhooks.listAvailableWebhookEvents.error.code
            )
        );
    }

    return Result.ok(responseData.webhooks.listAvailableWebhookEvents.data as WebhookEvent[]);
}
