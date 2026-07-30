import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { HttpStreamBody } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";

const TEXT_CONTENT_TYPE = /^text\/|^application\/(json|javascript|xml)|\+json|event-stream/i;

function getContentType(headers: Record<string, string> | undefined): string {
    if (!headers) {
        return "";
    }
    // Header names are case-insensitive and routes set them inconsistently ("Content-Type" vs
    // "content-type"), so match on the lowercased key rather than indexing one spelling.
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-type") {
            return headers[key] ?? "";
        }
    }
    return "";
}

/**
 * Translates the transport-agnostic IHttpResponse into an API Gateway Lambda result.
 *
 * Binary bodies (Buffer / Uint8Array — e.g. asset delivery) are base64-encoded with
 * `isBase64Encoded: true`; everything else is passed through as a string (JSON-stringified when
 * it's an object).
 *
 * Streaming bodies are drained first: API Gateway buffers the entire Lambda response regardless of
 * how it was produced, so it cannot deliver incrementally. Draining keeps a streaming route working
 * over this transport (as one buffered response) instead of failing — real streaming needs the
 * Lambda Function URL transport.
 */
export async function httpResponseToApiGatewayResult(
    response: IHttpResponse
): Promise<APIGatewayProxyResult> {
    let { body } = response;

    if (HttpStreamBody.is(body)) {
        const bytes = await body.collect();
        // Decode as text when the content type says so (SSE, JSON) — otherwise the Uint8Array falls
        // through to the base64 branch below, which is what a binary stream wants.
        body = TEXT_CONTENT_TYPE.test(getContentType(response.headers))
            ? new TextDecoder().decode(bytes)
            : bytes;
    }

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
