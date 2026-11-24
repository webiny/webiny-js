/**
 * Shows how a project decorates ONE route.
 *
 * There are two places to hook in, and both work:
 *
 * - `HttpRouteHandler` — wraps a route's BEHAVIOUR. Applies to every route, and `request.route.name`
 *   narrows it to one at request time. This is the plain form.
 * - `HttpRouteDefinition` — changes what a route IS: swap its handler, move its path. Use it when
 *   you need to alter the route rather than what it does.
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

    it("tells a route its own name, method and path", async () => {
        const container = new Container();

        class SelfAwareRoute implements HttpRouteHandler.Interface {
            async handle(request: HttpRouteHandler.Request): Promise<IHttpResponse> {
                return { statusCode: 200, body: request.route };
            }
        }

        container.register(
            createHttpRouteDefinition({
                name: "orders",
                method: "GET",
                path: "/orders/:id",
                handler: HttpRouteHandler.createImplementation({
                    implementation: SelfAwareRoute,
                    dependencies: []
                })
            })
        );

        const result = await routerFor(container).route(req("GET", "/orders/7"));

        expect(result.body).toEqual({ name: "orders", method: "GET", path: "/orders/:id" });
    });

    /**
     * The plain form: decorate `HttpRouteHandler` directly. No container, no `buildHttpRoute`, no
     * definition wrapper. It applies to every route, and `request.route.name` picks the one to act
     * on — which is why wrapping broadly and targeting narrowly are not in tension.
     */
    it("wraps behaviour with a plain handler decorator, targeted by name", async () => {
        const container = setup();
        const calls: string[] = [];

        container.registerDecorator(
            HttpRouteHandler.createDecorator({
                decorator: class implements HttpRouteHandler.Interface {
                    constructor(private readonly decoratee: HttpRouteHandler.Interface) {}

                    async handle(
                        request: HttpRouteHandler.Request,
                        response: HttpRouteHandler.Response
                    ) {
                        if (request.route.name !== "orders") {
                            return this.decoratee.handle(request, response);
                        }

                        calls.push("before");
                        const result = await this.decoratee.handle(request, response);
                        calls.push("after");
                        return result;
                    }
                },
                dependencies: []
            })
        );

        const router = routerFor(container);

        expect((await router.route(req("GET", "/orders"))).body).toBe("orders");
        expect(calls).toEqual(["before", "after"]);

        expect((await router.route(req("GET", "/invoices"))).body).toBe("invoices");
        expect(calls).toEqual(["before", "after"]);
    });
});
