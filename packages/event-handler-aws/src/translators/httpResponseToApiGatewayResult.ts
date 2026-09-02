import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import { HttpStreamBody } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { drainStreamBody } from "./drainStreamBody.js";

/**
 * An API Gateway result that can also carry `cookies`.
 *
 * `APIGatewayProxyResult` describes the REST API / payload format 1.0 shape, which has no `cookies`
 * field — that one belongs to HTTP API payload format 2.0. We target both formats, so the type gap
 * is closed here once instead of at the assignment site.
 */
export type ApiGatewayResult = APIGatewayProxyResult & { cookies?: string[] };

interface IEncodedBody {
    body: string;
    isBase64Encoded?: boolean;
}

/**
 * Binary bodies (Buffer / Uint8Array — e.g. asset delivery) are base64-encoded; everything else
 * becomes a string, JSON-stringified when it is an object.
 */
function encodeBody(body: unknown): IEncodedBody {
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return { body: Buffer.from(body).toString("base64"), isBase64Encoded: true };
    }

    if (body === undefined || body === null) {
        return { body: "" };
    }

    if (typeof body === "string") {
        return { body };
    }

    return { body: JSON.stringify(body) };
}

/**
 * Translates the transport-agnostic IHttpResponse into an API Gateway Lambda result.
 *
 * Streaming bodies are drained first: API Gateway buffers the entire Lambda response regardless of
 * how it was produced, so it cannot deliver incrementally. Draining keeps a streaming route working
 * over this transport (as one buffered response) instead of failing — real streaming needs the
 * Lambda Function URL transport.
 *
 * `Set-Cookie` can repeat, which `headers` cannot express, so cookies are emitted in BOTH shapes
 * API Gateway understands: `multiValueHeaders` (payload format 1.0) and `cookies` (2.0). Each
 * payload format ignores the other's field, so there's no duplication.
 */
export async function httpResponseToApiGatewayResult(
    response: IHttpResponse
): Promise<ApiGatewayResult> {
    const { cookies } = response;
    let { body } = response;

    if (HttpStreamBody.is(body)) {
        body = await drainStreamBody(body, response.headers);
    }

    const encoded = encodeBody(body);

    const result: ApiGatewayResult = {
        statusCode: response.statusCode,
        headers: response.headers,
        body: encoded.body
    };

    if (encoded.isBase64Encoded) {
        result.isBase64Encoded = true;
    }

    if (cookies && cookies.length > 0) {
        result.multiValueHeaders = { ...result.multiValueHeaders, "set-cookie": cookies };
        result.cookies = cookies;
    }

    return result;
}
