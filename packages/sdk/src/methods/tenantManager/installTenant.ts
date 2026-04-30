import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { installTenantSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface InstallTenantParams {
    tenantId: string;
}

/**
 * Installs and provisions a tenant with default settings and configurations.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for installing the tenant
 * @param params.tenantId - ID of the tenant to install
 * @returns Result containing true on success or an error
 */
export const installTenant = createMethod(
    installTenantSchema,
    async (config, fetchFn, { tenantId }) => {
        const query = `
        mutation InstallTenant($tenantId: ID!) {
            tenantManager {
                installTenant(tenantId: $tenantId) {
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

        if (responseData.tenantManager.installTenant.error) {
            return Result.fail(
                new ApiError(
                    responseData.tenantManager.installTenant.error.message,
                    responseData.tenantManager.installTenant.error.code
                )
            );
        }

        return Result.ok(responseData.tenantManager.installTenant.data as boolean);
    }
);
