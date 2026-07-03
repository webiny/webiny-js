import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IHttpResponse } from "@webiny/event-handler-core";

/**
 * Translates the transport-agnostic IHttpResponse into an API Gateway Lambda result.
 *
 * Binary bodies (Buffer / Uint8Array — e.g. asset delivery) are base64-encoded with
 * `isBase64Encoded: true`; everything else is passed through as a string (JSON-stringified when
 * it's an object).
 */
export function httpResponseToApiGatewayResult(response: IHttpResponse): APIGatewayProxyResult {
    const { body } = response;

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return {
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.from(body).toString("base64"),
            isBase64Encoded: true
        };
    }

    return {
        statusCode: response.statusCode,
        headers: response.headers,
        body:
            body === undefined || body === null
                ? ""
                : typeof body === "string"
                  ? body
                  : JSON.stringify(body)
    };
}
