import type { Constructor, Container } from "@webiny/di";
import { HttpRouteHandler } from "~/features/http/abstractions.js";
import type { IHttpRoute } from "~/features/http/abstractions.js";

/**
 * Builds the ONE route that matched.
 *
 * The obvious `container.resolve(HttpRouteHandler)` doesn't work: every route shares that
 * abstraction, so the container has no way to know which one is wanted, and `resolveAll` would
 * build all of them — the cost this whole arrangement exists to avoid.
 *
 * So the route is registered alone in a throwaway child scope and resolved there. `resolveInternal`
 * checks the current container before walking to its parent, so the only `HttpRouteHandler` in
 * scope is this route. Everything else still comes from the parent: the handler's own dependencies
 * resolve normally, and decorators registered on `HttpRouteHandler` DO apply, because this is the
 * ordinary resolution path rather than a side door around it.
 */
export function buildHttpRoute(
    container: Container,
    implementation: Constructor<IHttpRoute>
): IHttpRoute {
    const scope = container.createChildContainer();
    scope.register(implementation);

    return scope.resolve(HttpRouteHandler);
}
