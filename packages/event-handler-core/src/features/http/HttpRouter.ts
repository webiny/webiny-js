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
     * constructed — which happens before `route()` is ever called, and therefore before
     * `RequestContextInitializerDecorator` runs the request-context initializers. Any route whose
     * constructor reaches a token those initializers register (`FileModel`, a per-request `CmsModel`,
     * `EntryFromStorageTransform`) would throw "No registration found for ..." on EVERY request,
     * including an OPTIONS preflight to an unrelated path, because construction does not care which
     * route actually matches.
     *
     * Resolving inside `route()` puts route construction after the initializers, where a route's
     * declared dependencies can be resolved normally. This is what lets routes declare what they
     * need instead of taking a container and resolving lazily inside `handle()`.
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
