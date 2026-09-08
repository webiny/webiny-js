import type { Container } from "@webiny/di";
import { HttpRouteDefinition } from "~/features/http/abstractions.js";
import type { IHttpRouteRegistration } from "~/features/http/createHttpRoute.js";

/**
 * Registers both halves of a route: the handler implementation under its own abstraction, and the
 * matchable definition the router reads.
 *
 * Registering only the implementation leaves the route unreachable — the router matches on
 * definitions, so it would never be found. Hence one function that does both.
 */
export function registerHttpRoute(container: Container, route: IHttpRouteRegistration): void {
    container.register(route.implementation);

    container.registerInstance(HttpRouteDefinition, {
        method: route.method,
        path: route.path,
        handler: route.handler
    });
}
