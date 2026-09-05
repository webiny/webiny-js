import type { Container } from "@webiny/di";
import { HttpRouter, HttpRoute, RouteNotFoundError } from "~/features/http/abstractions.js";
import { HttpResponseBuilder } from "~/features/http/HttpResponseBuilder.js";
import { toHttpResponse } from "~/features/http/invokeHttpRoute.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
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
    /**
     * Takes the container, NOT `[HttpRoute, { multiple: true }]`.
     *
     * Injecting the routes would construct every one of them while the router itself is being
     * constructed. That used to be fatal: construction ran before the request-context initializers,
     * so any route whose constructor reached a token an initializer registered (`FileModel`, a
     * per-request `CmsModel`) threw "No registration found for ..." on EVERY request, including an
     * OPTIONS preflight to an unrelated path — construction does not care which route matches.
     *
     * That hazard is gone: those tokens are now providers with real implementations, resolvable at
     * any point. What remains is cost — constructing all ~11 routes to match one path — so routes
     * are still resolved inside `route()`. Injecting them is a viable cleanup, not a correctness fix.
     *
     * Still eager in that every route is constructed to path-match. Constructing only the matched
     * route needs `method`/`path` to be readable without an instance, which is a bigger change.
     */
    constructor(private container: Container) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        for (const route of this.container.resolveAll(HttpRoute)) {
            const params = this.match(route, request);
            if (params !== null) {
                const response = new HttpResponseBuilder();
                const result = await route.handle({ ...request, pathParameters: params }, response);
                return toHttpResponse(result, response);
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
    dependencies: [RequestContainer]
});
