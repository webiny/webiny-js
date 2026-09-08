import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";
import { HttpRouteDefinition } from "~/features/http/abstractions.js";
import type { IHttpRoute } from "~/features/http/abstractions.js";

export interface IRegisterHttpRouteInstanceParams {
    readonly method: string;
    readonly path: string;
    readonly route: IHttpRoute;
}

/**
 * Registers an ALREADY-BUILT route object under a fresh handler abstraction, plus the definition
 * the router matches on.
 *
 * For tests that hand-roll a route as a literal rather than declaring one with `createHttpRoute`.
 * Production code should use `createHttpRoute` + `registerHttpRoute`, which lets the container
 * build the route and keeps its dependencies declared.
 */
export function registerHttpRouteInstance(
    container: Container,
    params: IRegisterHttpRouteInstanceParams
): void {
    const handler = new Abstraction<IHttpRoute>(`HttpRoute/test:${params.method}${params.path}`);

    container.registerInstance(handler, params.route);
    container.registerInstance(HttpRouteDefinition, {
        method: params.method,
        path: params.path,
        handler
    });
}
