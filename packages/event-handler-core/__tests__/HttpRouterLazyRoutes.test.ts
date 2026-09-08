/**
 * Pins the reason routes are declared as data plus a separate handler abstraction.
 *
 * Matching used to require resolving every route to read its `path`, which built each one's whole
 * dependency graph on every request. In production that meant a request for a static asset
 * constructed the GraphQL engine, every contextual schema and the AI provider before discovering it
 * wanted none of them. If someone reintroduces that, these tests fail rather than the cost quietly
 * coming back.
 */
import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler, HttpRouter } from "~/features/http/abstractions.js";
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

/** Stands in for an expensive dependency — a GraphQL engine, an AI provider. */
const Expensive = new Abstraction<{ id: string }>("Expensive");

describe("HttpRouter route construction", () => {
    const setup = () => {
        const built: string[] = [];
        const container = new Container();

        container.registerFactory(Expensive, () => {
            built.push("expensive");
            return { id: "expensive" };
        });

        class CostlyRouteImpl implements HttpRouteHandler.Interface {
            constructor(private readonly expensive: { id: string }) {}
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: this.expensive.id };
            }
        }

        class CheapRouteImpl implements HttpRouteHandler.Interface {
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: "cheap" };
            }
        }

        const CostlyImpl = HttpRouteHandler.createImplementation({
            implementation: CostlyRouteImpl,
            dependencies: [Expensive]
        });
        container.registerInstance(HttpRouteDefinition, {
            method: "POST",
            path: "/costly",
            handler: CostlyImpl
        });

        const CheapImpl = HttpRouteHandler.createImplementation({
            implementation: CheapRouteImpl,
            dependencies: []
        });
        container.registerInstance(HttpRouteDefinition, {
            method: "GET",
            path: "/cheap",
            handler: CheapImpl
        });

        container.register(HttpRouterImpl);
        container.registerInstance(RequestContainer, container);

        return { router: container.resolve(HttpRouter), built };
    };

    it("does not build a route that was not matched", async () => {
        const { router, built } = setup();

        const result = await router.route(req("GET", "/cheap"));

        expect(result.body).toBe("cheap");
        expect(built).toEqual([]);
    });

    it("builds the matched route's dependencies", async () => {
        const { router, built } = setup();

        const result = await router.route(req("POST", "/costly"));

        expect(result.body).toBe("expensive");
        expect(built).toEqual(["expensive"]);
    });

    it("does not build any route when nothing matches", async () => {
        const { router, built } = setup();

        await expect(router.route(req("GET", "/nope"))).rejects.toThrow("Route not found");
        expect(built).toEqual([]);
    });

    /**
     * Documents a known limitation of building the route from its class rather than resolving a
     * per-route abstraction: decorators registered on the shared `HttpRouteHandler` do NOT reach
     * routes. That is the price of not resolving the abstraction, which would build all of them.
     * Nothing decorates routes today; a route that needs it has to get its own abstraction.
     */
    it("does not apply HttpRouteHandler decorators to routes", async () => {
        const container = new Container();
        const handle = vi.fn(async (): Promise<IHttpResponse> => ({
            statusCode: 200,
            body: "original"
        }));

        class RouteImpl implements HttpRouteHandler.Interface {
            handle = handle;
        }

        container.registerInstance(HttpRouteDefinition, {
            method: "GET",
            path: "/decorated",
            handler: HttpRouteHandler.createImplementation({
                implementation: RouteImpl,
                dependencies: []
            })
        });

        container.registerDecorator(
            HttpRouteHandler.createDecorator({
                decorator: class implements HttpRouteHandler.Interface {
                    constructor(private readonly decoratee: HttpRouteHandler.Interface) {}
                    async handle(): Promise<IHttpResponse> {
                        return { statusCode: 200, body: "decorated" };
                    }
                },
                dependencies: []
            })
        );

        container.register(HttpRouterImpl);
        container.registerInstance(RequestContainer, container);

        const result = await container.resolve(HttpRouter).route(req("GET", "/decorated"));

        expect(result.body).toBe("original");
        expect(handle).toHaveBeenCalledOnce();
    });
});
