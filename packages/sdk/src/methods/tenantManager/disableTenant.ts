import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import { parseParams } from "../../utils/validateParams.js";
import { disableTenantSchema } from "./schemas.js";

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
): Promise<Result<boolean, HttpError | ApiError | NetworkError | ValidationError>> {
    const parsed = parseParams(disableTenantSchema, params);
    if (!parsed.ok) {
        return parsed.result;
    }
    const { tenantId } = parsed.data;

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
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.tenantManager.disableTenant.error.message,
                responseData.tenantManager.disableTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.disableTenant.data);
}
