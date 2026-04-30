import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";

export interface EnableTenantParams {
    tenantId: string;
}

/**
 * Re-enables a previously disabled tenant.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for enabling the tenant
 * @param params.tenantId - ID of the tenant to enable
 * @returns Result containing true on success or an error
 */
export async function enableTenant(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: EnableTenantParams
): Promise<Result<boolean, HttpError | ApiError | NetworkError>> {
    const { tenantId } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation EnableTenant($tenantId: ID!) {
            tenantManager {
                enableTenant(tenantId: $tenantId) {
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

    if (responseData.tenantManager.enableTenant.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.tenantManager.enableTenant.error.message,
                responseData.tenantManager.enableTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.enableTenant.data);
}
