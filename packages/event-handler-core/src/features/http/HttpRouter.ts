import { HttpRouter, HttpRoute, matchPath, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { IHttpRoute, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

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
