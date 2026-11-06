import { hasJsonContentType } from "@webiny/event-handler-core";
import { parseJsonRequestBody } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";

/**
 * Translates a Lambda Function URL event (payload format 2.0) into the transport-agnostic
 * IHttpRequest.
 *
 * Close to the API Gateway v2 payload, with two differences that matter:
 * - cookies arrive as a `cookies` ARRAY, not a `cookie` header. They are folded back into a header so
 *   a route reading the `cookie` header needs no special case. Authentication never reads cookies.
 * - there is no stage prefix to strip: a Function URL always serves `$default`.
 */
export function functionUrlEventToHttpRequest(event: any): IHttpRequest {
    const headers: Record<string, string> = {
        ...((event.headers as Record<string, string>) || {})
    };

    if (Array.isArray(event.cookies) && event.cookies.length > 0) {
        headers.cookie = event.cookies.join("; ");
    }

    return {
        method: event.requestContext?.http?.method ?? "GET",
        path: event.rawPath || "/",
        headers,
        query: parseQuery(event),
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body: parseBody(event, headers)
    };
}

function parseQuery(event: any): Record<string, string> {
    // Prefer the pre-parsed map; fall back to rawQueryString, which is the only thing present when
    // the runtime omits `queryStringParameters` (it is absent, not empty, for a query-less request).
    if (event.queryStringParameters) {
        return event.queryStringParameters as Record<string, string>;
    }

    if (!event.rawQueryString) {
        return {};
    }

    const result: Record<string, string> = {};
    new URLSearchParams(event.rawQueryString).forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

function parseBody(event: any, headers: Record<string, string>): any {
    if (event.body === undefined || event.body === null) {
        return undefined;
    }

    const isJson = hasJsonContentType(headers);

    if (event.isBase64Encoded) {
        const buffer = Buffer.from(event.body, "base64");

        // Binary bodies stay raw; only decode when the content type says it is text.
        if (isJson) {
            const text = buffer.toString("utf8");
            return parseJsonRequestBody(text);
        }
        if (getContentType(headers).startsWith("text/")) {
            return buffer.toString("utf8");
        }
        return buffer;
    }

    // Only a body declared as JSON is parsed; every other text body reaches the route as a string.
    if (isJson) {
        return parseJsonRequestBody(event.body);
    }
    return event.body;
}

function getContentType(headers: Record<string, string>): string {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-type") {
            return (headers[key] ?? "").toLowerCase();
        }
    }
    return "";
}
