import type { IHttpRequest } from "@webiny/event-handler-core";

/**
 * Translates an API Gateway Lambda event into the transport-agnostic IHttpRequest.
 *
 * Handles both payload formats:
 * - v2 HTTP API: `rawPath` + `requestContext.http.method`
 * - v1 / HTTP API v1: `httpMethod` + `path`
 *
 * In both cases the stage prefix (e.g. `/myproj-default-198dde5/graphql`) is stripped so routes
 * match as registered.
 */
export function apiGatewayEventToHttpRequest(event: any): IHttpRequest {
    let body: any;
    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch {
            body = event.body;
        }
    }

    // v2 HTTP API payload format: rawPath + requestContext.http.method
    if (event.rawPath) {
        // rawPath includes the stage prefix for named stages, e.g.
        // /myproj-default-198dde5/graphql — strip it so routes match as registered.
        let path: string = event.rawPath;
        const stage: string | undefined = event.requestContext?.stage;
        if (stage && stage !== "$default") {
            const prefix = `/${stage}`;
            if (path.startsWith(`${prefix}/`)) {
                path = path.slice(prefix.length);
            } else if (path === prefix) {
                path = "/";
            }
        }
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
    // In HTTP API (v2) with payload format 1.0, event.path includes the stage prefix,
    // e.g. /myproj-default-198dde5/graphql. Strip it so routes match as registered.
    let v1Path: string = event.path;
    const v1Stage: string | undefined = event.requestContext?.stage;
    if (v1Stage) {
        const prefix = `/${v1Stage}`;
        if (v1Path.startsWith(`${prefix}/`)) {
            v1Path = v1Path.slice(prefix.length);
        } else if (v1Path === prefix) {
            v1Path = "/";
        }
    }
    return {
        method: event.httpMethod,
        path: v1Path,
        headers: (event.headers as Record<string, string>) || {},
        query: (event.queryStringParameters as Record<string, string>) || {},
        pathParameters: (event.pathParameters as Record<string, string>) || {},
        body
    };
}
