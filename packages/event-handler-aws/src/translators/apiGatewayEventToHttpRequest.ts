import { hasJsonContentType } from "@webiny/event-handler-core";
import { parseJsonRequestBody } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import { apiGatewayEventPath } from "./apiGatewayEventPath.js";

/**
 * Translates an API Gateway Lambda event into the transport-agnostic IHttpRequest.
 *
 * Handles both payload formats:
 * - v2 HTTP API: `rawPath` + `requestContext.http.method`
 * - v1 / HTTP API v1: `httpMethod` + `path`
 *
 * In both cases the stage prefix is stripped so routes match as registered (see
 * `apiGatewayEventPath`).
 *
 * Only a body declared as `application/json` is parsed (see `parseJsonRequestBody`); every other body
 * reaches the route as the raw string.
 */
export function apiGatewayEventToHttpRequest(event: any): IHttpRequest {
    const body = parseBody(event);

    const path = apiGatewayEventPath(event);

    // v2 HTTP API payload format: rawPath + requestContext.http.method
    if (event.rawPath) {
        return {
            method: event.requestContext.http.method,
            path,
            headers: (event.headers as Record<string, string>) || {},
            query: event.queryStringParameters || {},
            pathParameters: (event.pathParameters as Record<string, string>) || {},
            body
        };
    }

    // v1 / HTTP API v1 payload format: httpMethod + path.
    return {
        method: event.httpMethod,
        path,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body
    };
}

function parseBody(event: any): any {
    if (!event.body) {
        return undefined;
    }
    if (hasJsonContentType(event.headers)) {
        return parseJsonRequestBody(event.body);
    }
    return event.body;
}
