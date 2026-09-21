import type { IHttpRequest } from "@webiny/event-handler-core";

/**
 * Translates a Lambda Function URL event (payload format 2.0) into the transport-agnostic
 * IHttpRequest.
 *
 * Close to the API Gateway v2 payload, with two differences that matter:
 * - cookies arrive as a `cookies` ARRAY, not a `cookie` header. They are folded back into a header so
 *   downstream code (e.g. the identity loader reading `wby-id-token`) needs no special case.
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

    if (event.isBase64Encoded) {
        const buffer = Buffer.from(event.body, "base64");
        const contentType = getContentType(headers);

        // Binary bodies stay raw; only decode when the content type says it is text.
        if (contentType.includes("application/json")) {
            return tryParseJson(buffer.toString("utf8"));
        }
        if (contentType.startsWith("text/")) {
            return buffer.toString("utf8");
        }
        return buffer;
    }

    return tryParseJson(event.body);
}

function getContentType(headers: Record<string, string>): string {
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-type") {
            return (headers[key] ?? "").toLowerCase();
        }
    }
    return "";
}

function tryParseJson(value: string): any {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}
