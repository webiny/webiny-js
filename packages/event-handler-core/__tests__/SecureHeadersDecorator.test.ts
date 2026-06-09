import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouter } from "~/abstractions/IHttp.js";
import { HttpRouterImpl } from "~/handlers/HttpRouterImpl.js";
import { SecureHeadersDecorator } from "~/handlers/SecureHeadersDecorator.js";
import { HttpRoute } from "~/abstractions/IHttp.js";
import type { IHttpRequest, IHttpRoute, IHttpResponse } from "~/abstractions/IHttp.js";

const req = (method: string, path: string, origin?: string): IHttpRequest => ({
    method,
    path,
    headers: origin ? { origin } : {},
    query: {},
    pathParameters: {},
    body: undefined
});

describe("SecureHeadersDecorator", () => {
    it("should return 204 with CORS headers for OPTIONS", async () => {
        const container = new Container();
        container.register(HttpRouterImpl).inSingletonScope();
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("OPTIONS", "/graphql", "https://example.com"));
        expect(result.statusCode).toBe(204);
        expect(result.headers?.["access-control-allow-origin"]).toBe("https://example.com");
        expect(result.headers?.["access-control-allow-methods"]).toContain("POST");
    });

    it("should add CORS headers to normal responses", async () => {
        const container = new Container();

        const route: IHttpRoute = {
            method: "GET",
            path: "/test",
            async handle(_r: IHttpRequest): Promise<IHttpResponse> {
                return { statusCode: 200, headers: {}, body: "ok" };
            }
        };

        container.registerInstance(HttpRoute, route);
        container.register(HttpRouterImpl).inSingletonScope();
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("GET", "/test", "https://example.com"));
        expect(result.headers?.["access-control-allow-origin"]).toBe("https://example.com");
        expect(result.headers?.["access-control-allow-credentials"]).toBe("true");
        expect(result.headers?.["vary"]).toBe("origin");
    });

    it("should use * as origin when no origin header", async () => {
        const container = new Container();
        container.register(HttpRouterImpl).inSingletonScope();
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("OPTIONS", "/test"));
        expect(result.headers?.["access-control-allow-origin"]).toBe("*");
    });
});
