import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpRoute, HttpRouter } from "~/abstractions/IHttp.js";
import { HttpRouterImpl } from "~/handlers/HttpRouterImpl.js";
import type { IHttpRequest, IHttpResponse } from "~/abstractions/IHttp.js";

function makeRoute(method: string, path: string, body: any = "ok"): HttpRoute.Interface {
    return {
        method,
        path,
        async handle(_req: IHttpRequest): Promise<IHttpResponse> {
            return { statusCode: 200, body };
        }
    };
}

function makeRouter(...routes: HttpRoute.Interface[]): HttpRouter.Interface {
    const container = new Container();
    for (const route of routes) {
        container.registerInstance(HttpRoute, route);
    }
    container.register(HttpRouterImpl);
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
        const route: HttpRoute.Interface = {
            method: "GET",
            path: "/users/:id",
            async handle(r: IHttpRequest): Promise<IHttpResponse> {
                return { statusCode: 200, body: r.pathParameters["id"] };
            }
        };
        const router = makeRouter(route);
        const result = await router.route(req("GET", "/users/abc123"));
        expect(result.body).toBe("abc123");
    });

    it("should extract multiple path parameters", async () => {
        const route: HttpRoute.Interface = {
            method: "GET",
            path: "/tenants/:tenantId/users/:userId",
            async handle(r: IHttpRequest): Promise<IHttpResponse> {
                return { statusCode: 200, body: r.pathParameters };
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
