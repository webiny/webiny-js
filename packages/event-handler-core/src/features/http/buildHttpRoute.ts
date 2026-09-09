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
 * exists to avoid.
 *
 * The trade-off is decorators. `resolveWithDependencies` is the ONE resolve path in `@webiny/di`
 * that never calls `applyDecorators` — `resolveInternal`, `resolveRegistration` and
 * `resolveMultiple` all do. So decorators registered on `HttpRouteHandler` never reach a route.
 *
 * Decorate `HttpRouteDefinition` instead: the router resolves definitions normally, so decorators
 * apply, and a definition's `name` identifies which route you have. To change a route's BEHAVIOUR
 * rather than replace it, return a wrapper class as the definition's `handler` and let it call this
 * function on the original — see the wrapping test in `HttpRouteDecoration.test.ts`.
 *
 * If `@webiny/di` ever grows a way to resolve a specific implementation through the decorating path
 * (`resolve()` accepting an implementation, a `resolveImplementation()`, or `resolveWithDependencies`
 * simply calling `applyDecorators` like every other path), this can use it and `HttpRouteHandler`
 * decorators would start working without giving up lazy construction.
 *
 * That buys CROSS-CUTTING decoration — every route wrapped the same way, for timing or logging.
 * It does NOT replace decorating the definition: a handler decorator receives only the route
 * instance, which carries no name, so it cannot tell which route it is wrapping. Targeting one
 * route stays a definition-level job.
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
