/**
 * Shows how a project decorates ONE route.
 *
 * Decorators do not reach `HttpRouteHandler` — the router builds the matched handler class directly
 * rather than resolving that shared abstraction, which is what keeps unmatched routes unbuilt (see
 * `HttpRouterLazyRoutes.test.ts`). `HttpRouteDefinition` is different: the router resolves it, so a
 * decorator sees every route in turn. `name` is how you tell which one you have.
 */
import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler, HttpRouter } from "~/features/http/abstractions.js";
import { createHttpRouteDefinition } from "~/features/http/createHttpRouteDefinition.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

const req = (method: string, path: string): IHttpRequest => ({
    method,
    path,
    headers: {},
    query: {},
    pathParameters: {},
    body: undefined
});

const makeHandler = (body: string) => {
    class RouteImpl implements HttpRouteHandler.Interface {
        async handle(): Promise<IHttpResponse> {
            return { statusCode: 200, body };
        }
    }

    return HttpRouteHandler.createImplementation({
        implementation: RouteImpl,
        dependencies: []
    });
};

const setup = () => {
    const container = new Container();

    container.register(
        createHttpRouteDefinition({
            name: "orders",
            method: "GET",
            path: "/orders",
            handler: makeHandler("orders")
        })
    );
    container.register(
        createHttpRouteDefinition({
            name: "invoices",
            method: "GET",
            path: "/invoices",
            handler: makeHandler("invoices")
        })
    );

    return container;
};

const routerFor = (container: Container) => {
    container.register(HttpRouterImpl);
    container.registerInstance(RequestContainer, container);
    return container.resolve(HttpRouter);
};

describe("decorating a route by name", () => {
    it("swaps the handler of the named route only", async () => {
        const container = setup();

        class ReplacedRoute implements HttpRouteHandler.Interface {
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: "replaced" };
            }
        }

        const replaced = HttpRouteHandler.createImplementation({
            implementation: ReplacedRoute,
            dependencies: []
        });

        container.registerDecorator(
            HttpRouteDefinition.createDecorator({
                decorator: class implements HttpRouteDefinition.Interface {
                    constructor(private readonly decoratee: HttpRouteDefinition.Interface) {}

                    get name() {
                        return this.decoratee.name;
                    }
                    get method() {
                        return this.decoratee.method;
                    }
                    get path() {
                        return this.decoratee.path;
                    }
                    get handler() {
                        // Every definition passes through here; `name` selects the one to change.
                        return this.decoratee.name === "orders" ? replaced : this.decoratee.handler;
                    }
                },
                dependencies: []
            })
        );

        const router = routerFor(container);

        expect((await router.route(req("GET", "/orders"))).body).toBe("replaced");
        expect((await router.route(req("GET", "/invoices"))).body).toBe("invoices");
    });

    it("can repoint the named route's path", async () => {
        const container = setup();

        container.registerDecorator(
            HttpRouteDefinition.createDecorator({
                decorator: class implements HttpRouteDefinition.Interface {
                    constructor(private readonly decoratee: HttpRouteDefinition.Interface) {}

                    get name() {
                        return this.decoratee.name;
                    }
                    get method() {
                        return this.decoratee.method;
                    }
                    get path() {
                        return this.decoratee.name === "invoices"
                            ? "/billing"
                            : this.decoratee.path;
                    }
                    get handler() {
                        return this.decoratee.handler;
                    }
                },
                dependencies: []
            })
        );

        const router = routerFor(container);

        expect((await router.route(req("GET", "/billing"))).body).toBe("invoices");
        await expect(router.route(req("GET", "/invoices"))).rejects.toThrow("Route not found");
    });

    it("still builds only the matched route", async () => {
        const container = setup();

        container.registerDecorator(
            HttpRouteDefinition.createDecorator({
                decorator: class implements HttpRouteDefinition.Interface {
                    constructor(private readonly decoratee: HttpRouteDefinition.Interface) {}

                    get name() {
                        return this.decoratee.name;
                    }
                    get method() {
                        return this.decoratee.method;
                    }
                    get path() {
                        return this.decoratee.path;
                    }
                    get handler() {
                        return this.decoratee.handler;
                    }
                },
                dependencies: []
            })
        );

        const built = vi.fn();
        class CountedRoute implements HttpRouteHandler.Interface {
            constructor() {
                built();
            }
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: "counted" };
            }
        }

        container.register(
            createHttpRouteDefinition({
                name: "counted",
                method: "GET",
                path: "/counted",
                handler: HttpRouteHandler.createImplementation({
                    implementation: CountedRoute,
                    dependencies: []
                })
            })
        );

        const router = routerFor(container);
        await router.route(req("GET", "/orders"));

        // Decorating definitions does not resurrect the eager-construction cost: the counted
        // route's handler is never built, because its definition never matched.
        expect(built).not.toHaveBeenCalled();
    });
});
