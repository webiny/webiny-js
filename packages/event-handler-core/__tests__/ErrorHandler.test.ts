import { describe, it, expect } from "vitest";
import { createTestHttpHandler } from "~/features/testing/index.js";
import { HttpRoute } from "~/features/http/abstractions.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";
import { createHttpRoute } from "~/features/http/createHttpRoute.js";
import { registerHttpRoute } from "~/features/http/registerHttpRoute.js";

class ThrowingRoute implements HttpRoute.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        throw new Error("route exploded");
    }
}

const ThrowingRouteImpl = createHttpRoute({
    name: "test:Throwing",
    method: "GET",
    path: "/boom",
    implementation: ThrowingRoute,
    dependencies: []
});

class OkRoute implements HttpRoute.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        return { statusCode: 200, body: "ok" };
    }
}

const OkRouteImpl = createHttpRoute({
    name: "test:Ok",
    method: "GET",
    path: "/ok",
    implementation: OkRoute,
    dependencies: []
});

describe("HttpFeature error handling", () => {
    it("should return 500 when a route throws", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                registerHttpRoute(container, ThrowingRouteImpl);
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
                registerHttpRoute(container, OkRouteImpl);
            }
        });

        const result = await handler({ method: "GET", path: "/ok" });
        expect(result.statusCode).toBe(200);
    });
});
