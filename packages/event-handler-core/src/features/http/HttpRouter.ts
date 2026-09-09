import type { Container } from "@webiny/di";
import {
    HttpRouter,
    HttpRouteDefinition,
    RouteNotFoundError
} from "~/features/http/abstractions.js";
import { HttpResponseBuilder } from "~/features/http/HttpResponseBuilder.js";
import { toHttpResponse } from "~/features/http/invokeHttpRoute.js";
import { buildHttpRoute } from "~/features/http/buildHttpRoute.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import type {
    IHttpRouteDefinition,
    IHttpRequest,
    IHttpResponse
} from "~/features/http/abstractions.js";

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
     * Takes the container so it can build the matched route — and ONLY the matched route.
     *
     * A definition declares no dependencies, so resolving all of them to match a path is a handful
     * of field assignments. Routes used to be resolved as instances just to read their `path`,
     * which built every one of their dependency graphs on every request: a static-asset request
     * constructed the whole GraphQL engine, every contextual schema and the AI provider before
     * discovering it wanted none of them.
     *
     * See {@link buildHttpRoute} for how the winner is built, and what that costs.
     */
    constructor(private container: Container) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        for (const definition of this.container.resolveAll(HttpRouteDefinition)) {
            const params = this.match(definition, request);
            if (params === null) {
                continue;
            }

            const route = buildHttpRoute(this.container, definition.handler);
            const response = new HttpResponseBuilder();
            const result = await route.handle(
                {
                    ...request,
                    pathParameters: params,
                    // Lets a route — or anything wrapping one — know which route is running.
                    route: {
                        name: definition.name,
                        method: definition.method,
                        path: definition.path
                    }
                },
                response
            );
            return toHttpResponse(result, response);
        }
        throw new RouteNotFoundError(request.method, request.path);
    }

    private match(
        definition: IHttpRouteDefinition,
        request: IHttpRequest
    ): Record<string, string> | null {
        if (definition.method !== request.method) {
            return null;
        }
        return matchPath(definition.path, request.path);
    }
}

export const HttpRouterImpl = HttpRouter.createImplementation({
    implementation: HttpRouterImplClass,
    dependencies: [RequestContainer]
});
