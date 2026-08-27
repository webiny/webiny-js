import type { IHttpResponse } from "./abstractions.js";

/**
 * Builds a JSON response, so routes don't each repeat the content-type literal.
 */
export function jsonResponse(statusCode: number, body: unknown): IHttpResponse {
    return {
        statusCode,
        headers: { "content-type": "application/json" },
        body
    };
}
