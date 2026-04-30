import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { disableTenantSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface DisableTenantParams {
    tenantId: string;
}

/**
 * Disables a tenant, preventing access to its resources.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for disabling the tenant
 * @param params.tenantId - ID of the tenant to disable
 * @returns Result containing true on success or an error
 */
export const disableTenant = createMethod(
    disableTenantSchema,
    async (config, fetchFn, { tenantId }) => {
        const query = `
        mutation DisableTenant($tenantId: ID!) {
            tenantManager {
                disableTenant(tenantId: $tenantId) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { tenantId });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.tenantManager.disableTenant.error) {
            return Result.fail(
                new ApiError(
                    responseData.tenantManager.disableTenant.error.message,
                    responseData.tenantManager.disableTenant.error.code
                )
            );
        }

        return Result.ok(responseData.tenantManager.disableTenant.data as boolean);
    }
);
