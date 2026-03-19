import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type { CreateTenantInput } from "./tenantManagerTypes.js";

export interface CreateTenantParams {
    data: CreateTenantInput;
}

/**
 * Creates a new tenant in the system.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the tenant
 * @param params.data - The tenant data to create
 * @returns Result containing true on success or an error
 */
export async function createTenant(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CreateTenantParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { data } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation CreateTenant($input: CreateTenantInput!) {
            tenantManager {
                createTenant(input: $input) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { input: data });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.tenantManager.createTenant.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.tenantManager.createTenant.error.message,
                responseData.tenantManager.createTenant.error.code
            )
        );
    }

    return Result.ok(responseData.tenantManager.createTenant.data);
}
