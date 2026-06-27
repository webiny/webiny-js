import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { AuthTokenExtractor } from "@webiny/api-core/features/requestContext/index.js";

function parseCookieHeader(cookieHeader: string): Record<string, string> {
    return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
        const idx = pair.indexOf("=");
        if (idx > 0) {
            acc[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
        }
        return acc;
    }, {});
}

/**
 * Reads the `wby-id-token` auth cookie from an API Gateway event. Returns null when no such cookie
 * is present (not applicable — the establisher then falls back to other token sources / anonymous).
 */
class ApiGatewayCookieAuthTokenExtractorImpl implements AuthTokenExtractor.Interface {
    extract(event: unknown): string | null {
        const headers = (event as APIGatewayProxyEvent)?.headers;
        if (!headers) {
            return null;
        }
        const cookieHeader = headers["cookie"] ?? headers["Cookie"] ?? "";
        return parseCookieHeader(cookieHeader)["wby-id-token"] ?? null;
    }
}

export const ApiGatewayCookieAuthTokenExtractor = AuthTokenExtractor.createImplementation({
    implementation: ApiGatewayCookieAuthTokenExtractorImpl,
    dependencies: []
});
