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

export class RouteNotFoundError extends Error {
    readonly code = "ROUTE_NOT_FOUND" as const;

    constructor(method: string, path: string) {
        super(`Route not found: ${method} ${path}`);
    }
}
