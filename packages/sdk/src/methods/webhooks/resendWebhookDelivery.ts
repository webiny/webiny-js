import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { resendWebhookDeliverySchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ResendWebhookDeliveryParams {
    id: string;
}

export const resendWebhookDelivery = createMethod(
    resendWebhookDeliverySchema,
    async (config, fetchFn, { id }) => {
        const query = `
        mutation ResendWebhookDelivery($id: ID!) {
            webhooks {
                resendWebhookDelivery(id: $id) {
                    data
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

        if (responseData.webhooks.resendWebhookDelivery.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.resendWebhookDelivery.error.message,
                    responseData.webhooks.resendWebhookDelivery.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.resendWebhookDelivery.data as boolean);
    }
);
