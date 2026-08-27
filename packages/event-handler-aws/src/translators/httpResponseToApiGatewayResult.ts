import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IHttpResponse } from "@webiny/event-handler-core";

/**
 * Translates the transport-agnostic IHttpResponse into an API Gateway Lambda result.
 *
 * Binary bodies (Buffer / Uint8Array — e.g. asset delivery) are base64-encoded with
 * `isBase64Encoded: true`; everything else is passed through as a string (JSON-stringified when
 * it's an object).
 *
 * `Set-Cookie` can repeat, which `headers` cannot express, so cookies are emitted in BOTH shapes
 * API Gateway understands: `multiValueHeaders` (REST API / payload format 1.0) and `cookies`
 * (HTTP API payload format 2.0, which isn't part of the v1 `APIGatewayProxyResult` type — hence the
 * cast). Each payload format ignores the other's field, so there's no duplication.
 */
export function httpResponseToApiGatewayResult(response: IHttpResponse): APIGatewayProxyResult {
    const { body, cookies } = response;

    const result: APIGatewayProxyResult =
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
        (result as APIGatewayProxyResult & { cookies?: string[] }).cookies = cookies;
    }

    return result;
}
