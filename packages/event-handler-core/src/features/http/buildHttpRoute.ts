import type { Constructor, Container } from "@webiny/di";
import { HttpRouteHandler } from "~/features/http/abstractions.js";
import type { IHttpRoute } from "~/features/http/abstractions.js";

/**
 * Builds the ONE route that matched, and only that one.
 *
 * The problem: every route is registered under the same `HttpRouteHandler` abstraction, so there is
 * no `resolve()` call that means "give me this particular route". `resolve()` cannot tell them
 * apart, and `resolveAll()` returns all of them — building all of them, which is the cost this
 * whole arrangement exists to avoid.
 *
 * The fix: make a child container whose ONLY `HttpRouteHandler` registration is this route, and
 * resolve there. `Container.resolveInternal` checks the current container before walking up to its
 * parent, so the child's single registration wins and the parent's other routes are never touched.
 *
 * Nothing else is isolated by the child — it delegates everything it does not have. So the route's
 * own dependencies resolve out of the parent exactly as before, and decorators registered on
 * `HttpRouteHandler` still apply, because this is the ordinary resolution path rather than a way
 * around it. That last part is the reason for doing it this way: an earlier version called
 * `resolveWithDependencies`, the one resolve path in `@webiny/di` that skips decorators, which
 * silently made routes undecoratable.
 *
 * The child is thrown away with the request. It holds one registration and no instances of its own.
 */
export function buildHttpRoute(
    container: Container,
    implementation: Constructor<IHttpRoute>
): IHttpRoute {
    const scope = container.createChildContainer();
    scope.register(implementation);

    return scope.resolve(HttpRouteHandler);
}
