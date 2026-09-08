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
import { HttpRouter } from "~/features/http/abstractions.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { createHttpRoute } from "~/features/http/createHttpRoute.js";
import { registerHttpRoute } from "~/features/http/registerHttpRoute.js";
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

        class CostlyRouteImpl {
            constructor(private readonly expensive: { id: string }) {}
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: this.expensive.id };
            }
        }

        class CheapRouteImpl {
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: "cheap" };
            }
        }

        registerHttpRoute(
            container,
            createHttpRoute({
                name: "test:Costly",
                method: "POST",
                path: "/costly",
                implementation: CostlyRouteImpl,
                dependencies: [Expensive]
            })
        );
        registerHttpRoute(
            container,
            createHttpRoute({
                name: "test:Cheap",
                method: "GET",
                path: "/cheap",
                implementation: CheapRouteImpl,
                dependencies: []
            })
        );

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

    it("resolves the matched route through DI, so it can be decorated", async () => {
        const container = new Container();
        const handle = vi.fn(async (): Promise<IHttpResponse> => ({
            statusCode: 200,
            body: "original"
        }));

        class RouteImpl {
            handle = handle;
        }

        const route = createHttpRoute({
            name: "test:Decorated",
            method: "GET",
            path: "/decorated",
            implementation: RouteImpl,
            dependencies: []
        });
        registerHttpRoute(container, route);

        container.registerDecorator(
            route.handler.createDecorator({
                decorator: class {
                    constructor(private readonly decoratee: { handle: typeof handle }) {}
                    async handle(): Promise<IHttpResponse> {
                        await this.decoratee.handle();
                        return { statusCode: 200, body: "decorated" };
                    }
                },
                dependencies: []
            })
        );

        container.register(HttpRouterImpl);
        container.registerInstance(RequestContainer, container);

        const result = await container.resolve(HttpRouter).route(req("GET", "/decorated"));

        expect(result.body).toBe("decorated");
        expect(handle).toHaveBeenCalledOnce();
    });
});
