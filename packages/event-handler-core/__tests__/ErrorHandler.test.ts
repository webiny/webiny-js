import { describe, it, expect } from "vitest";
import { createTestHttpHandler } from "~/features/testing/index.js";
import { HttpRouteDefinition, HttpRouteHandler } from "~/features/http/abstractions.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

class ThrowingRoute implements HttpRouteHandler.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        throw new Error("route exploded");
    }
}

const ThrowingRouteImpl = HttpRouteHandler.createImplementation({
    implementation: ThrowingRoute,
    dependencies: []
});
const ThrowingRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/boom",
    handler: ThrowingRouteImpl
};

class OkRoute implements HttpRouteHandler.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        return { statusCode: 200, body: "ok" };
    }
}

const OkRouteImpl = HttpRouteHandler.createImplementation({
    implementation: OkRoute,
    dependencies: []
});
const OkRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/ok",
    handler: OkRouteImpl
};

describe("HttpFeature error handling", () => {
    it("should return 500 when a route throws", async () => {
        const handler = createTestHttpHandler({
            root: container => {
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
                container.registerInstance(HttpRouteDefinition, OkRouteDefinition);
            }
        });

        const result = await handler({ method: "GET", path: "/ok" });
        expect(result.statusCode).toBe(200);
    });
});
