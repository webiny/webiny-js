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
import type { Container as ContainerType } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler, HttpRouter } from "~/features/http/abstractions.js";
import { createHttpRouteDefinition } from "~/features/http/createHttpRouteDefinition.js";
import { buildHttpRoute } from "~/features/http/buildHttpRoute.js";
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

    /**
     * Wrapping a route's BEHAVIOUR, which a decorator on `HttpRouteHandler` would normally do.
     *
     * It cannot, so the definition stands in: return a wrapper class as the `handler`, and let it
     * build the original with `buildHttpRoute`. The wrapper has to take `RequestContainer` because
     * it cannot know the wrapped route's dependencies — the one place that is justified.
     *
     * This gets simpler if `resolveWithDependencies` (`buildHttpRoute.ts:26`) is ever replaced by a
     * DI method that applies decorators; `HttpRouteHandler` decorators would then work directly.
     */
    it("can run before/after around the original handler", async () => {
        const container = new Container();
        const order: string[] = [];

        class OrdersRoute implements HttpRouteHandler.Interface {
            async handle(): Promise<IHttpResponse> {
                order.push("original");
                return { statusCode: 200, body: "orders" };
            }
        }

        container.register(
            createHttpRouteDefinition({
                name: "orders",
                method: "GET",
                path: "/orders",
                handler: HttpRouteHandler.createImplementation({
                    implementation: OrdersRoute,
                    dependencies: []
                })
            })
        );

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
                        if (this.decoratee.name !== "orders") {
                            return this.decoratee.handler;
                        }

                        const inner = this.decoratee.handler;

                        class Wrapper implements HttpRouteHandler.Interface {
                            constructor(private readonly container: ContainerType) {}

                            async handle(
                                request: IHttpRequest,
                                response: HttpRouteHandler.Response
                            ) {
                                order.push("before");
                                const result = await buildHttpRoute(this.container, inner).handle(
                                    request,
                                    response
                                );
                                order.push("after");
                                return result;
                            }
                        }

                        return HttpRouteHandler.createImplementation({
                            implementation: Wrapper,
                            dependencies: [RequestContainer]
                        });
                    }
                },
                dependencies: []
            })
        );

        const router = routerFor(container);
        const result = await router.route(req("GET", "/orders"));

        expect(result.body).toBe("orders");
        expect(order).toEqual(["before", "original", "after"]);
    });
});
