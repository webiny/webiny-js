import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

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
export async function installTenant(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: InstallTenantParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { tenantId } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

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
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.tenantManager.installTenant.error.message,
                responseData.tenantManager.installTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.installTenant.data);
}
