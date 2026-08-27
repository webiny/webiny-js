import { HttpRouter, HttpRoute, RouteNotFoundError } from "~/features/http/abstractions.js";
import { HttpResponseBuilder } from "~/features/http/HttpResponseBuilder.js";
import { toHttpResponse } from "~/features/http/invokeHttpRoute.js";
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
    // TODO: revisit eager route construction.
    // Injecting [HttpRoute, { multiple: true }] constructs EVERY registered route on each request
    // just to path-match, so a route's constructor runs even when its path doesn't match. Any route
    // whose constructor pulls a request-time-registered token (e.g. CMS use-cases needing
    // EntryFromStorageTransform / a per-request CmsModel) then throws "No registration found" before
    // any handler runs. Current routes work around this by resolving such deps lazily inside handle()
    // (AssetDeliveryRoute, WebsiteBuilderRedirectsRoute) or by pre-registering them before routing.
    // The systemic fix is to construct only the matched route lazily (inject route factories/thunks,
    // or resolve HttpRoute by matched path on demand) so this workaround isn't required per route.
    constructor(private routes: IHttpRoute[]) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        for (const route of this.routes) {
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
    dependencies: [[HttpRoute, { multiple: true }]]
});
