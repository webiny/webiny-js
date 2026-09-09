import type { Constructor } from "@webiny/di";
import { HttpRouteDefinition } from "~/features/http/abstractions.js";
import type { IHttpRoute, IHttpRouteDefinition } from "~/features/http/abstractions.js";

export interface ICreateHttpRouteDefinitionParams {
    readonly method: string;
    readonly path: string;
    readonly handler: Constructor<IHttpRoute>;
}

/**
 * Builds an `HttpRouteDefinition` implementation from plain values.
 *
 * For callers that only learn a route's method and path at build time — the `Api.Route` extension
 * generates its registration from the props in `webiny.config.tsx`, so the handler file never
 * restates them and the two can't drift. Hand-written routes should declare the definition class
 * directly instead; it reads better and keeps the values next to the handler.
 */
export function createHttpRouteDefinition(
    params: ICreateHttpRouteDefinitionParams
): Constructor<IHttpRouteDefinition> {
    class GeneratedHttpRouteDefinition implements HttpRouteDefinition.Interface {
        readonly method = params.method;
        readonly path = params.path;
        readonly handler = params.handler;
    }

    return HttpRouteDefinition.createImplementation({
        implementation: GeneratedHttpRouteDefinition,
        dependencies: []
    });
}
