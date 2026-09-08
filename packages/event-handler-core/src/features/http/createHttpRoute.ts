import { Abstraction } from "@webiny/di";
import type { Constructor, Dependencies } from "@webiny/di";
import type { IHttpRoute, IHttpRouteDefinition } from "~/features/http/abstractions.js";

/** A route's matchable data plus the implementation to register for its handler abstraction. */
export interface IHttpRouteRegistration extends IHttpRouteDefinition {
    readonly implementation: Constructor<IHttpRoute>;
}

export interface ICreateHttpRouteParams<T extends Constructor<IHttpRoute>> {
    /**
     * Distinguishes this route's handler abstraction from every other one. Only ever seen in DI
     * errors and debug output, so it just needs to be unique and recognisable.
     */
    readonly name: string;
    readonly method: string;
    readonly path: string;
    readonly implementation: T;
    readonly dependencies: Dependencies<T>;
}

/**
 * Declares a route as matchable data (`method`, `path`) plus a handler registered under its OWN
 * abstraction. `HttpRouter` resolves the data to match a request and resolves the handler only for
 * the route that wins, so a request never builds the dependency graphs of routes it didn't hit.
 *
 * Giving each route its own abstraction — rather than handing the router a constructor — keeps the
 * matched route on the normal `container.resolve()` path, so decorators still apply to it.
 */
export function createHttpRoute<T extends Constructor<IHttpRoute>>(
    params: ICreateHttpRouteParams<T>
): IHttpRouteRegistration {
    const handler = new Abstraction<IHttpRoute>(`HttpRoute/${params.name}`);

    const implementation = handler.createImplementation({
        implementation: params.implementation,
        dependencies: params.dependencies
    });

    return {
        method: params.method,
        path: params.path,
        handler,
        implementation
    };
}
