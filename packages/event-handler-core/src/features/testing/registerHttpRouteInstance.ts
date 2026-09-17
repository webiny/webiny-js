import type { Container } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler } from "~/features/http/abstractions.js";
import type {
    IHttpRequest,
    IHttpResponse,
    IHttpResponseBuilder
} from "~/features/http/abstractions.js";
import type { IHttpRoute } from "~/features/http/abstractions.js";

export interface IRegisterHttpRouteInstanceParams {
    readonly name?: string;
    readonly method: string;
    readonly path: string;
    readonly route: IHttpRoute;
}

/**
 * Registers a definition pointing at an ALREADY-BUILT route object.
 *
 * For tests that hand-roll a route as a literal. The router builds routes from a class, so the
 * literal is wrapped in a zero-dependency one that delegates to it. Production code declares its
 * class with `HttpRouteHandler.createImplementation` and points the definition straight at it.
 */
export function registerHttpRouteInstance(
    container: Container,
    params: IRegisterHttpRouteInstanceParams
): void {
    class DelegatingRoute implements HttpRouteHandler.Interface {
        handle(
            request: IHttpRequest,
            response: IHttpResponseBuilder
        ): Promise<IHttpResponse | IHttpResponseBuilder | void> {
            return Promise.resolve(params.route.handle(request, response));
        }
    }

    const handler = HttpRouteHandler.createImplementation({
        implementation: DelegatingRoute,
        dependencies: []
    });

    class DelegatingRouteDefinition implements HttpRouteDefinition.Interface {
        readonly name = params.name ?? `test:${params.method}${params.path}`;
        readonly method = params.method;
        readonly path = params.path;
        readonly handler = handler;
    }

    container.register(
        HttpRouteDefinition.createImplementation({
            implementation: DelegatingRouteDefinition,
            dependencies: []
        })
    );
}
