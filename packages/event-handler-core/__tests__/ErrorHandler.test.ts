import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
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

class CodedErrorRoute implements HttpRouteHandler.Interface {
    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        const error = new Error("Entry is locked.");
        throw Object.assign(error, {
            code: "Entry/Locked",
            data: { id: 1 }
        });
    }
}

const CodedErrorRouteImpl = HttpRouteHandler.createImplementation({
    implementation: CodedErrorRoute,
    dependencies: []
});
const CodedErrorRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/locked",
    handler: CodedErrorRouteImpl
};

const ORIGIN = "https://admin.example.com";
const ERROR_HEADERS = {
    "content-type": "application/json",
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-credentials": "true",
    vary: "origin"
};

describe("HttpFeature error handling", () => {
    beforeEach(() => {
        // HttpErrorDecorator logs the errors it answers with a 500.
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

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

    /*
     * A browser on another origin can only read an error response that carries the CORS headers,
     * so every error the router answers goes out through SecureHeadersDecorator.
     */
    it("answers a route's error with a 500 that carries the CORS headers", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(HttpRouteDefinition, ThrowingRouteDefinition);
            }
        });

        const result = await handler({ method: "GET", path: "/boom", headers: { origin: ORIGIN } });

        expect(result).toEqual({
            statusCode: 500,
            headers: ERROR_HEADERS,
            body: { message: "Internal server error" }
        });
    });

    it("answers a coded error with its code and data, and the CORS headers", async () => {
        const handler = createTestHttpHandler({
            root: container => {
                container.registerInstance(HttpRouteDefinition, CodedErrorRouteDefinition);
            }
        });

        const result = await handler({
            method: "GET",
            path: "/locked",
            headers: { origin: ORIGIN }
        });

        expect(result).toEqual({
            statusCode: 500,
            headers: ERROR_HEADERS,
            body: { message: "Entry is locked.", code: "Entry/Locked", data: { id: 1 } }
        });
    });

    it("answers an unknown route with a 404 that carries the CORS headers", async () => {
        const handler = createTestHttpHandler({
            root: () => {}
        });

        const result = await handler({
            method: "GET",
            path: "/missing",
            headers: { origin: ORIGIN }
        });

        expect(result).toEqual({
            statusCode: 404,
            headers: ERROR_HEADERS,
            body: { message: "Route not found: GET /missing" }
        });
    });
});
