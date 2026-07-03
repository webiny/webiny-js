import { describe, it, expect } from "vitest";
import { createTestHttpHandler } from "~/features/testing/index.js";
import { HttpRoute } from "~/features/http/abstractions.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

class ThrowingRoute {
    readonly method = "GET";
    readonly path = "/boom";

    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        throw new Error("route exploded");
    }
}

const ThrowingRouteImpl = HttpRoute.createImplementation({
    implementation: ThrowingRoute,
    dependencies: []
});

class OkRoute {
    readonly method = "GET";
    readonly path = "/ok";

    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        return { statusCode: 200, body: "ok" };
    }
}

const OkRouteImpl = HttpRoute.createImplementation({
    implementation: OkRoute,
    dependencies: []
});

describe("HttpFeature error handling", () => {
    it("should return 500 when a route throws", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                container.register(ThrowingRouteImpl);
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
            }
        });

        const result = await handler({ method: "GET", path: "/ok" });
        expect(result.statusCode).toBe(200);
    });
});
