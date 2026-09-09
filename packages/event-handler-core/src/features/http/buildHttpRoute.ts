import { Metadata } from "@webiny/di";
import type { Constructor, Container, Dependencies } from "@webiny/di";
import type { IHttpRoute } from "~/features/http/abstractions.js";

/**
 * Builds a route from its implementation class.
 *
 * `HttpRouteHandler.createImplementation` records the class's dependencies as metadata, so they
 * resolve from `container` exactly as they would through `resolve()`.
 *
 * Deliberately NOT `container.resolve(HttpRouteHandler)`: every route shares that abstraction, so
 * resolving it returns — and therefore builds — all of them, which is the cost this arrangement
 * exists to avoid. The trade-off is that decorators registered on `HttpRouteHandler` do not apply
 * to routes; a route needing decoration has to be registered under an abstraction of its own.
 */
export function buildHttpRoute(
    container: Container,
    implementation: Constructor<IHttpRoute>
): IHttpRoute {
    // Metadata stores the loose `Dependency[]` shape; resolveWithDependencies wants the tuple form
    // derived from the constructor. Same values, so this narrows rather than converts.
    const dependencies = new Metadata(implementation).getDependencies() as Dependencies<
        Constructor<IHttpRoute>
    >;

    return container.resolveWithDependencies({ implementation, dependencies });
}
