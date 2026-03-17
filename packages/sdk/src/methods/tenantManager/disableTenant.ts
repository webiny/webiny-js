import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

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
export async function disableTenant(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: DisableTenantParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { tenantId } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

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
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.tenantManager.disableTenant.error.message,
                responseData.tenantManager.disableTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.disableTenant.data);
}
