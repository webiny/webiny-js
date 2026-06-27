import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { AuthTokenExtractor } from "@webiny/api-core/features/requestContext/index.js";

/**
 * Reads the bearer token from the `Authorization` header of an API Gateway event. Returns "" when
 * the header is absent (HTTP request with no token) so it is still authenticated as anonymous,
 * preserving the previous always-authenticate-the-header behavior. Returns null for non-HTTP events.
 */
class ApiGatewayBearerAuthTokenExtractorImpl implements AuthTokenExtractor.Interface {
    extract(event: unknown): string | null {
        const headers = (event as APIGatewayProxyEvent)?.headers;
        if (!headers) {
            return null;
        }
        const raw = headers["authorization"] ?? headers["Authorization"] ?? "";
        return raw.replace(/^Bearer\s+/i, "");
    }
}

export const ApiGatewayBearerAuthTokenExtractor = AuthTokenExtractor.createImplementation({
    implementation: ApiGatewayBearerAuthTokenExtractorImpl,
    dependencies: []
});
