import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouter } from "~/features/http/abstractions.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { SecureHeadersDecorator } from "~/features/http/decorators/SecureHeadersDecorator.js";
import { HttpRoute } from "~/features/http/abstractions.js";
import type { IHttpRequest, IHttpRoute, IHttpResponse } from "~/features/http/abstractions.js";

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
        container.registerInstance(RequestContainer, container);
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("OPTIONS", "/graphql", "https://example.com"));
        expect(result.statusCode).toBe(204);
        expect(result.headers?.["access-control-allow-origin"]).toBe("https://example.com");
        expect(result.headers?.["access-control-allow-methods"]).toContain("POST");
    });

    it("should allow every custom request header Webiny clients send", async () => {
        // A header missing from this list makes the browser fail the preflight CORS check and never
        // send the actual request — which surfaces as an opaque "Failed to fetch", not a 4xx.
        const container = new Container();
        container.register(HttpRouterImpl).inSingletonScope();
        container.registerInstance(RequestContainer, container);
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("OPTIONS", "/stream/x", "https://example.com"));
        const allowed = result.headers?.["access-control-allow-headers"] ?? "";

        for (const header of [
            "authorization",
            "x-webiny-authorization",
            "x-tenant",
            "content-type",
            // Sent by a streaming client whenever its request carries a body.
            "x-amz-content-sha256"
        ]) {
            expect(allowed).toContain(header);
        }
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
        container.registerInstance(RequestContainer, container);
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
        container.registerInstance(RequestContainer, container);
        container.registerDecorator(SecureHeadersDecorator);
        const router = container.resolve(HttpRouter);

        const result = await router.route(req("OPTIONS", "/test"));
        expect(result.headers?.["access-control-allow-origin"]).toBe("*");
    });
});
