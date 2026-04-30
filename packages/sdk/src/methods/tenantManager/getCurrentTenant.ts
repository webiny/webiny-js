import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";

export interface Tenant {
    id: string;
    values: Record<string, unknown>;
}

/**
 * Returns the current tenant for the authenticated context.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @returns Result containing the current tenant or an error
 */
export async function getCurrentTenant(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<Tenant, HttpError | ApiError | NetworkError>> {
    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query GetCurrentTenant {
            tenantManager {
                getCurrentTenant {
                    data {
                        id
                        values
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

    if (responseData.tenantManager.getCurrentTenant.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.tenantManager.getCurrentTenant.error.message,
                responseData.tenantManager.getCurrentTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.getCurrentTenant.data);
}
