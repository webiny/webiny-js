import type { Container } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler } from "~/features/http/abstractions.js";
import type {
    IHttpRequest,
    IHttpResponse,
    IHttpResponseBuilder
} from "~/features/http/abstractions.js";
import type { IHttpRoute } from "~/features/http/abstractions.js";

export interface IRegisterHttpRouteInstanceParams {
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

    container.registerInstance(HttpRouteDefinition, {
        method: params.method,
        path: params.path,
        handler
    });
}
