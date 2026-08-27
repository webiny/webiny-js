import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IHttpResponse } from "@webiny/event-handler-core";

/**
 * An API Gateway result that can also carry `cookies`.
 *
 * `APIGatewayProxyResult` describes the REST API / payload format 1.0 shape, which has no `cookies`
 * field — that one belongs to HTTP API payload format 2.0. We target both formats, so the type gap
 * is closed here once instead of at the assignment site.
 */
export type ApiGatewayResult = APIGatewayProxyResult & { cookies?: string[] };

/**
 * Translates the transport-agnostic IHttpResponse into an API Gateway Lambda result.
 *
 * Binary bodies (Buffer / Uint8Array — e.g. asset delivery) are base64-encoded with
 * `isBase64Encoded: true`; everything else is passed through as a string (JSON-stringified when
 * it's an object).
 *
 * `Set-Cookie` can repeat, which `headers` cannot express, so cookies are emitted in BOTH shapes
 * API Gateway understands: `multiValueHeaders` (payload format 1.0) and `cookies` (2.0). Each
 * payload format ignores the other's field, so there's no duplication.
 */
export function httpResponseToApiGatewayResult(response: IHttpResponse): ApiGatewayResult {
    const { body, cookies } = response;

    const result: ApiGatewayResult =
        Buffer.isBuffer(body) || body instanceof Uint8Array
            ? {
                  statusCode: response.statusCode,
                  headers: response.headers,
                  body: Buffer.from(body).toString("base64"),
                  isBase64Encoded: true
              }
            : {
                  statusCode: response.statusCode,
                  headers: response.headers,
                  body:
                      body === undefined || body === null
                          ? ""
                          : typeof body === "string"
                            ? body
                            : JSON.stringify(body)
              };

    if (cookies && cookies.length > 0) {
        result.multiValueHeaders = { ...result.multiValueHeaders, "set-cookie": cookies };
        result.cookies = cookies;
    }

    return result;
}
