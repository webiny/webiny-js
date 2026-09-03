import { describe, it, expect } from "vitest";
import zlib from "node:zlib";
import { Container } from "@webiny/di";
import { HttpRouter } from "~/features/http/abstractions.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { CompressionDecorator } from "~/features/http/decorators/CompressionDecorator.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpStreamBody } from "~/features/http/HttpStreamBody.js";
import { HttpRoute } from "~/features/http/abstractions.js";
import type {
    IHttpRequest,
    IHttpResponse,
    IHttpResponseBuilder,
    IHttpRoute
} from "~/features/http/abstractions.js";

const req = (acceptEncoding?: string): IHttpRequest => ({
    method: "GET",
    path: "/test",
    headers: acceptEncoding ? { "accept-encoding": acceptEncoding } : {},
    query: {},
    pathParameters: {},
    body: undefined
});

const routerForRoute = (handle: IHttpRoute["handle"]) => {
    const container = new Container();
    const route: IHttpRoute = { method: "GET", path: "/test", handle };
    container.registerInstance(HttpRoute, route);
    container.register(HttpRouterImpl).inSingletonScope();
    container.registerDecorator(CompressionDecorator);
    // The router resolves routes through the request container, the way ChildContainerFactory wires
    // it in production.
    container.registerInstance(RequestContainer, container);
    return container.resolve(HttpRouter);
};

// A route that returns a plain IHttpResponse — the pre-builder style.
const routerFor = (response: IHttpResponse) => routerForRoute(async () => response);

// A body comfortably above the 1024-byte compression threshold.
const largeBody = () => ({ data: "x".repeat(5000) });

describe("CompressionDecorator", () => {
    // Compression and streaming are mutually exclusive: compressing means draining, which defeats
    // incremental delivery. Without the guard in serializeBody a stream body falls through to the
    // JSON branch, and the body is REPLACED by a gzipped `{"source":...}`.
    //
    // The source is an OBJECT with enumerable data, not a generator, on purpose: a generator
    // stringifies to `{}` and would slip under the size threshold, so the test would pass with or
    // without the guard and pin nothing.
    it("should leave a streaming body untouched", async () => {
        const source = {
            padding: "x".repeat(5000),
            async *[Symbol.asyncIterator]() {
                yield "data: hello\n\n";
            }
        };

        const streamBody = new HttpStreamBody(source);
        const router = routerFor({
            statusCode: 200,
            headers: { "content-type": "text/event-stream" },
            body: streamBody
        });

        const result = await router.route(req("gzip, deflate, br"));

        expect(result.body).toBe(streamBody);
        expect(result.headers?.["content-encoding"]).toBeUndefined();
    });

    it("should gzip a large body when the client accepts gzip", async () => {
        const router = routerFor({ statusCode: 200, headers: {}, body: largeBody() });

        const result = await router.route(req("gzip, deflate"));

        expect(result.headers?.["content-encoding"]).toBe("gzip");
        expect(Buffer.isBuffer(result.body)).toBe(true);
        expect(result.headers?.["content-length"]).toBe(String((result.body as Buffer).length));

        const decompressed = zlib.gunzipSync(result.body as Buffer).toString("utf8");
        expect(JSON.parse(decompressed)).toEqual(largeBody());
    });

    it("should prefer brotli when the client accepts br", async () => {
        const router = routerFor({ statusCode: 200, headers: {}, body: largeBody() });

        const result = await router.route(req("gzip, deflate, br"));

        expect(result.headers?.["content-encoding"]).toBe("br");
        const decompressed = zlib.brotliDecompressSync(result.body as Buffer).toString("utf8");
        expect(JSON.parse(decompressed)).toEqual(largeBody());
    });

    it("should not compress when the client accepts no supported encoding", async () => {
        const body = largeBody();
        const router = routerFor({ statusCode: 200, headers: {}, body });

        const result = await router.route(req("identity"));

        expect(result.headers?.["content-encoding"]).toBeUndefined();
        expect(result.body).toBe(body);
    });

    it("should not compress when no accept-encoding header is present", async () => {
        const body = largeBody();
        const router = routerFor({ statusCode: 200, headers: {}, body });

        const result = await router.route(req());

        expect(result.headers?.["content-encoding"]).toBeUndefined();
        expect(result.body).toBe(body);
    });

    it("should not compress bodies below the threshold", async () => {
        const body = { data: "small" };
        const router = routerFor({ statusCode: 200, headers: {}, body });

        const result = await router.route(req("gzip"));

        expect(result.headers?.["content-encoding"]).toBeUndefined();
        expect(result.body).toBe(body);
    });

    it("should not compress binary (Buffer) bodies", async () => {
        const body = Buffer.alloc(5000, 1);
        const router = routerFor({ statusCode: 200, headers: {}, body });

        const result = await router.route(req("gzip, br"));

        expect(result.headers?.["content-encoding"]).toBeUndefined();
        expect(result.body).toBe(body);
    });

    it("should not double-encode an already-encoded response", async () => {
        const body = Buffer.from("already-compressed");
        const router = routerFor({
            statusCode: 200,
            headers: { "content-encoding": "gzip" },
            body
        });

        const result = await router.route(req("gzip"));

        expect(result.body).toBe(body);
        expect(result.headers?.["content-encoding"]).toBe("gzip");
    });

    it("should merge accept-encoding into an existing vary header", async () => {
        const router = routerFor({
            statusCode: 200,
            headers: { vary: "origin" },
            body: largeBody()
        });

        const result = await router.route(req("gzip"));

        expect(result.headers?.["vary"]).toBe("origin, accept-encoding");
    });

    // The router now hands routes a mutable IHttpResponseBuilder; `.json()` serializes the body to a
    // string before it reaches the decorator. Verify compression works through that materialized path.
    it("should compress a response produced via the response builder", async () => {
        const router = routerForRoute(
            async (_request: IHttpRequest, response: IHttpResponseBuilder) =>
                response.json(largeBody())
        );

        const result = await router.route(req("gzip"));

        expect(result.headers?.["content-encoding"]).toBe("gzip");
        expect(result.headers?.["content-type"]).toBe("application/json");
        const decompressed = zlib.gunzipSync(result.body as Buffer).toString("utf8");
        expect(JSON.parse(decompressed)).toEqual(largeBody());
    });

    it("should preserve Set-Cookie when compressing", async () => {
        const router = routerFor({
            statusCode: 200,
            headers: {},
            cookies: ["sid=abc; Path=/; HttpOnly"],
            body: largeBody()
        });

        const result = await router.route(req("gzip"));

        expect(result.headers?.["content-encoding"]).toBe("gzip");
        expect(result.cookies).toEqual(["sid=abc; Path=/; HttpOnly"]);
    });
});
