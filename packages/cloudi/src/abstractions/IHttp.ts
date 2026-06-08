import { Abstraction } from "@webiny/di";

export interface IHttpRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    pathParameters: Record<string, string>;
    body: any;
}

export interface IHttpResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body?: any;
}

export interface IHttpRoute {
    readonly method: string;
    readonly path: string;
    handle(request: IHttpRequest): Promise<IHttpResponse>;
}

export interface IHttpRouter {
    route(request: IHttpRequest): Promise<IHttpResponse>;
}

export const HttpRoute = new Abstraction<IHttpRoute>("HttpRoute");
export const HttpRouter = new Abstraction<IHttpRouter>("HttpRouter");

export namespace HttpRoute {
    export type Interface = IHttpRoute;
}

export namespace HttpRouter {
    export type Interface = IHttpRouter;
}

export function isHttpRequest(event: any): event is IHttpRequest {
    return (
        typeof event === "object" &&
        event !== null &&
        typeof event.method === "string" &&
        typeof event.path === "string" &&
        typeof event.headers === "object" &&
        typeof event.query === "object"
    );
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -2);
        return path.startsWith(prefix) ? {} : null;
    }

    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = path.split("/").filter(Boolean);

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
        const pp = patternParts[i];
        const pathPart = pathParts[i];

        if (pp.startsWith(":")) {
            params[pp.slice(1)] = decodeURIComponent(pathPart);
        } else if (pp !== pathPart) {
            return null;
        }
    }

    return params;
}

export class RouteNotFoundError extends Error {
    readonly code = "ROUTE_NOT_FOUND" as const;

    constructor(method: string, path: string) {
        super(`Route not found: ${method} ${path}`);
    }
}
