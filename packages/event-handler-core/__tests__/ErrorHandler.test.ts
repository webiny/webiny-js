import { Abstraction } from "@webiny/di";
import { describe, it, expect } from "vitest";
import { createTestHttpHandler } from "~/features/testing/index.js";
import { HttpRoute, HttpRouteDefinition } from "~/features/http/abstractions.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

class ThrowingRoute implements HttpRoute.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        throw new Error("route exploded");
    }
}

const ThrowingRouteHandler = new Abstraction<HttpRoute.Interface>("test:Throwing");
const ThrowingRouteImpl = ThrowingRouteHandler.createImplementation({
    implementation: ThrowingRoute,
    dependencies: []
});
const ThrowingRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/boom",
    handler: ThrowingRouteHandler
};

class OkRoute implements HttpRoute.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        return { statusCode: 200, body: "ok" };
    }
}

const OkRouteHandler = new Abstraction<HttpRoute.Interface>("test:Ok");
const OkRouteImpl = OkRouteHandler.createImplementation({
    implementation: OkRoute,
    dependencies: []
});
const OkRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/ok",
    handler: OkRouteHandler
};

describe("HttpFeature error handling", () => {
    it("should return 500 when a route throws", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                container.register(ThrowingRouteImpl);
                container.registerInstance(HttpRouteDefinition, ThrowingRouteDefinition);
            }
        });

        const result = await handler({ method: "GET", path: "/boom" });
        expect(result.statusCode).toBe(500);
    });

    it("should return 404 for unknown routes", async () => {
        const handler = createTestHttpHandler({
            root: () => {}
        });

        const result = await handler({ method: "GET", path: "/missing" });
        expect(result.statusCode).toBe(404);
    });

    it("should pass through successful responses", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                container.register(OkRouteImpl);
                container.registerInstance(HttpRouteDefinition, OkRouteDefinition);
            }
        });

        const result = await handler({ method: "GET", path: "/ok" });
        expect(result.statusCode).toBe(200);
    });
});
