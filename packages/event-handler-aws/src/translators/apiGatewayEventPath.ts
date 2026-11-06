/**
 * The HTTP method of an API Gateway event, for both payload formats: v2 HTTP API
 * (`requestContext.http.method`) and v1 / HTTP API v1 (`httpMethod`).
 */
export function apiGatewayEventMethod(event: any): string {
    if (event?.rawPath) {
        return event.requestContext?.http?.method ?? "";
    }
    return event?.httpMethod ?? "";
}

/**
 * The route path of an API Gateway event, for both payload formats, with the stage prefix
 * (e.g. `/myproj-default-198dde5/graphql`) stripped so it matches routes as registered.
 *
 * - v2 HTTP API: `rawPath` includes the prefix for named stages; `$default` has none.
 * - v1 / HTTP API v1: in HTTP API with payload format 1.0, `path` includes the stage prefix.
 *
 * Shared by the request translator and by anything that must see the same path before routing
 * (e.g. the identity loader deciding whether a request may authenticate with a cookie).
 */
export function apiGatewayEventPath(event: any): string {
    if (event?.rawPath) {
        const stage: string | undefined = event.requestContext?.stage;
        return stripStagePrefix(event.rawPath, stage && stage !== "$default" ? stage : undefined);
    }
    return stripStagePrefix(event?.path ?? "", event?.requestContext?.stage);
}

function stripStagePrefix(path: string, stage: string | undefined): string {
    if (!stage) {
        return path;
    }
    const prefix = `/${stage}`;
    if (path.startsWith(`${prefix}/`)) {
        return path.slice(prefix.length);
    }
    if (path === prefix) {
        return "/";
    }
    return path;
}
