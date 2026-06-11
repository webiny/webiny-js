import { HttpRouter, HttpRoute, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { IHttpRoute, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

function matchPath(pattern: string, path: string): Record<string, string> | null {
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

class HttpRouterImplClass implements HttpRouter.Interface {
    constructor(private routes: IHttpRoute[]) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        for (const route of this.routes) {
            const params = this.match(route, request);
            if (params !== null) {
                return route.handle({ ...request, pathParameters: params });
            }
        }
        throw new RouteNotFoundError(request.method, request.path);
    }

    private match(route: IHttpRoute, request: IHttpRequest): Record<string, string> | null {
        if (route.method !== request.method) {
            return null;
        }
        return matchPath(route.path, request.path);
    }
}

export const HttpRouterImpl = HttpRouter.createImplementation({
    implementation: HttpRouterImplClass,
    dependencies: [[HttpRoute, { multiple: true }]]
});
