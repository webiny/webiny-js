import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { deleteWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface DeleteWebhookParams {
    id: string;
}

export const deleteWebhook = createMethod(deleteWebhookSchema, async (config, fetchFn, { id }) => {
    const query = `
        mutation DeleteWebhook($id: ID!) {
            webhooks {
                deleteWebhook(id: $id) {
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

    if (responseData.webhooks.deleteWebhook.error) {
        return Result.fail(
            new ApiError(
                responseData.webhooks.deleteWebhook.error.message,
                responseData.webhooks.deleteWebhook.error.code
            )
        );
    }

    return Result.ok(responseData.webhooks.deleteWebhook.data as boolean);
});
