import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { TenantIdExtractor } from "@webiny/api-core/features/requestContext/index.js";

/**
 * Reads the tenant id from the `x-tenant` header of an API Gateway event.
 */
class ApiGatewayTenantIdExtractorImpl implements TenantIdExtractor.Interface {
    extract(event: unknown): string | null {
        const headers = (event as APIGatewayProxyEvent)?.headers;
        if (!headers) {
            return null;
        }
        return headers["x-tenant"] ?? headers["X-Tenant"] ?? null;
    }
}

export const ApiGatewayTenantIdExtractor = TenantIdExtractor.createImplementation({
    implementation: ApiGatewayTenantIdExtractorImpl,
    dependencies: []
});
