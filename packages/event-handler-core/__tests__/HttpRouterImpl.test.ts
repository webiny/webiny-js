import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import { HttpRoute, HttpRouteDefinition, HttpRouter } from "~/features/http/abstractions.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

/** A route plus the method/path the router matches on, mirroring what `createHttpRoute` builds. */
interface TestRoute {
    method: string;
    path: string;
    route: HttpRoute.Interface;
}

function makeRoute(method: string, path: string, body: any = "ok"): TestRoute {
    return {
        method,
        path,
        route: {
            async handle(_req: IHttpRequest): Promise<IHttpResponse> {
                return { statusCode: 200, body };
            }
        }
    };
}

function makeRouter(...routes: TestRoute[]): HttpRouter.Interface {
    const container = new Container();
    for (const { method, path, route } of routes) {
        // Each route gets its own handler abstraction, so only the matched one is resolved.
        const handler = new Abstraction<HttpRoute.Interface>(`HttpRoute/${method}${path}`);
        container.registerInstance(handler, route);
        container.registerInstance(HttpRouteDefinition, { method, path, handler });
    }
    container.register(HttpRouterImpl);
    // The router resolves routes through the request container, the way ChildContainerFactory
    // wires it in production.
    container.registerInstance(RequestContainer, container);
    return container.resolve(HttpRouter);
}

const req = (method: string, path: string): IHttpRequest => ({
    method,
    path,
    headers: {},
    query: {},
    pathParameters: {},
    body: undefined
});

describe("HttpRouterImpl", () => {
    it("should match exact path", async () => {
        const router = makeRouter(makeRoute("GET", "/hello", "hello"));
        const result = await router.route(req("GET", "/hello"));
        expect(result.body).toBe("hello");
    });

    it("should match wildcard path", async () => {
        const router = makeRouter(makeRoute("GET", "/files/*", "file"));
        const result = await router.route(req("GET", "/files/logo.svg"));
        expect(result.body).toBe("file");
    });

    it("should extract :id path parameters", async () => {
        const route: TestRoute = {
            method: "GET",
            path: "/users/:id",
            route: {
                async handle(r: IHttpRequest): Promise<IHttpResponse> {
                    return { statusCode: 200, body: r.pathParameters["id"] };
                }
            }
        };
        const router = makeRouter(route);
        const result = await router.route(req("GET", "/users/abc123"));
        expect(result.body).toBe("abc123");
    });

    it("should extract multiple path parameters", async () => {
        const route: TestRoute = {
            method: "GET",
            path: "/tenants/:tenantId/users/:userId",
            route: {
                async handle(r: IHttpRequest): Promise<IHttpResponse> {
                    return { statusCode: 200, body: r.pathParameters };
                }
            }
        };
        const router = makeRouter(route);
        const result = await router.route(req("GET", "/tenants/acme/users/42"));
        expect(result.body).toEqual({ tenantId: "acme", userId: "42" });
    });

    it("should not match wrong method", async () => {
        const router = makeRouter(makeRoute("POST", "/hello"));
        await expect(router.route(req("GET", "/hello"))).rejects.toThrow("Route not found");
    });

    it("should not match wrong path", async () => {
        const router = makeRouter(makeRoute("GET", "/hello"));
        await expect(router.route(req("GET", "/world"))).rejects.toThrow("Route not found");
    });

    it("should match first route when multiple match", async () => {
        const router = makeRouter(
            makeRoute("GET", "/hello", "first"),
            makeRoute("GET", "/hello", "second")
        );
        const result = await router.route(req("GET", "/hello"));
        expect(result.body).toBe("first");
    });
});
