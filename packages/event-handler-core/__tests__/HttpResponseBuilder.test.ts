import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpRoute, HttpRouter } from "~/features/http/abstractions.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpResponseBuilder, serializeCookie } from "~/features/http/HttpResponseBuilder.js";
import { HttpStreamBody } from "~/features/http/HttpStreamBody.js";
import type {
    IHttpRequest,
    IHttpResponse,
    IHttpResponseBuilder
} from "~/features/http/abstractions.js";

const req = (method: string, path: string): IHttpRequest => ({
    method,
    path,
    headers: {},
    query: {},
    pathParameters: {},
    body: undefined
});

function makeRouter(route: HttpRoute.Interface): HttpRouter.Interface {
    const container = new Container();
    container.registerInstance(HttpRoute, route);
    container.register(HttpRouterImpl);
    container.registerInstance(RequestContainer, container);
    return container.resolve(HttpRouter);
}

describe("serializeCookie", () => {
    it("should default the path to /", () => {
        expect(serializeCookie("sid", "abc")).toBe("sid=abc; Path=/");
    });

    it("should url-encode the value", () => {
        expect(serializeCookie("sid", "a b/c")).toBe("sid=a%20b%2Fc; Path=/");
    });

    it("should serialize all supported attributes", () => {
        const cookie = serializeCookie("sid", "abc", {
            maxAge: 3600,
            domain: "example.com",
            path: "/admin",
            expires: new Date(0),
            httpOnly: true,
            secure: true,
            partitioned: true,
            sameSite: "strict"
        });

        expect(cookie).toBe(
            "sid=abc; Max-Age=3600; Domain=example.com; Path=/admin; " +
                "Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; Partitioned; SameSite=Strict"
        );
    });
});

describe("HttpResponseBuilder", () => {
    it("should default to 200 with no headers or body", () => {
        expect(new HttpResponseBuilder().toResponse()).toEqual({ statusCode: 200 });
    });

    it("should chain status, headers and json body", () => {
        const response = new HttpResponseBuilder()
            .status(201)
            .header("X-Custom", "yes")
            .json({ id: 1 })
            .toResponse();

        expect(response).toEqual({
            statusCode: 201,
            headers: { "x-custom": "yes", "content-type": "application/json" },
            body: JSON.stringify({ id: 1 })
        });
    });

    it("should not override an explicitly set content-type in json()", () => {
        const response = new HttpResponseBuilder()
            .type("application/vnd.api+json")
            .json({ id: 1 })
            .toResponse();

        expect(response.headers?.["content-type"]).toBe("application/vnd.api+json");
    });

    it("should resolve type shorthands", () => {
        expect(new HttpResponseBuilder().type("html").getHeader("content-type")).toBe(
            "text/html; charset=utf-8"
        );
        expect(new HttpResponseBuilder().type("bin").getHeader("content-type")).toBe(
            "application/octet-stream"
        );
    });

    it("should treat header names case-insensitively", () => {
        const builder = new HttpResponseBuilder().header("Content-Type", "text/plain");
        expect(builder.getHeader("CONTENT-TYPE")).toBe("text/plain");
        builder.removeHeader("content-TYPE");
        expect(builder.getHeader("content-type")).toBeUndefined();
    });

    it("should collect multiple cookies", () => {
        const response = new HttpResponseBuilder()
            .cookie("a", "1", { httpOnly: true })
            .cookie("b", "2")
            .toResponse();

        expect(response.cookies).toEqual(["a=1; Path=/; HttpOnly", "b=2; Path=/"]);
    });

    it("should expire the cookie in clearCookie", () => {
        const [cookie] = new HttpResponseBuilder().clearCookie("sid").toResponse().cookies!;
        expect(cookie).toContain("Max-Age=0");
        expect(cookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    });

    it("should infer content-type in send()", () => {
        expect(new HttpResponseBuilder().send("hi").toResponse()).toEqual({
            statusCode: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
            body: "hi"
        });

        const buffer = Buffer.from([1, 2, 3]);
        expect(new HttpResponseBuilder().send(buffer).toResponse()).toEqual({
            statusCode: 200,
            headers: { "content-type": "application/octet-stream" },
            body: buffer
        });

        expect(new HttpResponseBuilder().send({ a: 1 }).toResponse()).toEqual({
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ a: 1 })
        });
    });

    it("should not set a content-type in end()", () => {
        expect(new HttpResponseBuilder().end("raw").toResponse()).toEqual({
            statusCode: 200,
            body: "raw"
        });
    });

    it("should set location and status in redirect()", () => {
        expect(new HttpResponseBuilder().redirect("/login").toResponse()).toEqual({
            statusCode: 302,
            headers: { location: "/login" }
        });
        expect(new HttpResponseBuilder().redirect("/login", 301).toResponse().statusCode).toBe(301);
    });
});

describe("HttpResponseBuilder.sse", () => {
    async function* source() {
        yield "data: one\n\n";
    }

    it("should answer 200 with a streaming body", async () => {
        const response = new HttpResponseBuilder().sse(source()).toResponse();

        expect(response.statusCode).toBe(200);
        expect(HttpStreamBody.is(response.body)).toBe(true);
    });

    it("should set the headers that keep delivery incremental", () => {
        const headers = new HttpResponseBuilder().sse(source()).toResponse().headers!;

        expect(headers["content-type"]).toBe("text/event-stream");
        // Without `no-transform` CloudFront compresses the body, which buffers chunks; without
        // `x-accel-buffering` nginx-family proxies buffer it. Either one silently defeats streaming.
        expect(headers["cache-control"]).toContain("no-transform");
        expect(headers["x-accel-buffering"]).toBe("no");
        expect(headers["connection"]).toBe("keep-alive");
    });

    it("should pass the source through untouched", async () => {
        const response = new HttpResponseBuilder().sse(source()).toResponse();
        const body = response.body as HttpStreamBody;

        expect(new TextDecoder().decode(await body.collect())).toBe("data: one\n\n");
    });

    it("should still carry a cookie set alongside the stream", () => {
        const response = new HttpResponseBuilder().cookie("sid", "abc").sse(source()).toResponse();

        expect(response.cookies?.[0]).toContain("sid=abc");
        expect(HttpStreamBody.is(response.body)).toBe(true);
    });
});

describe("HttpRouterImpl response builder", () => {
    it("should use the builder returned from handle()", async () => {
        const router = makeRouter({
            method: "GET",
            path: "/me",
            async handle(_r: IHttpRequest, response: IHttpResponseBuilder) {
                return response.status(201).cookie("sid", "abc").json({ ok: true });
            }
        });

        const result = await router.route(req("GET", "/me"));

        expect(result).toEqual({
            statusCode: 201,
            headers: { "content-type": "application/json" },
            cookies: ["sid=abc; Path=/"],
            body: JSON.stringify({ ok: true })
        });
    });

    it("should use the mutated builder when handle() returns nothing", async () => {
        const router = makeRouter({
            method: "GET",
            path: "/me",
            async handle(_r: IHttpRequest, response: IHttpResponseBuilder) {
                response.status(204).header("x-done", "1");
            }
        });

        expect(await router.route(req("GET", "/me"))).toEqual({
            statusCode: 204,
            headers: { "x-done": "1" }
        });
    });

    it("should pass a plain IHttpResponse through untouched", async () => {
        const router = makeRouter({
            method: "GET",
            path: "/legacy",
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, headers: { "Content-Type": "text/plain" }, body: "ok" };
            }
        });

        expect(await router.route(req("GET", "/legacy"))).toEqual({
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: "ok"
        });
    });

    it("should merge builder state under a returned IHttpResponse", async () => {
        const router = makeRouter({
            method: "GET",
            path: "/mixed",
            async handle(_r: IHttpRequest, response: IHttpResponseBuilder): Promise<IHttpResponse> {
                response.cookie("sid", "abc").header("x-from-builder", "1").header("x-both", "b");
                return { statusCode: 200, headers: { "x-both": "r" }, body: "ok" };
            }
        });

        expect(await router.route(req("GET", "/mixed"))).toEqual({
            statusCode: 200,
            headers: { "x-from-builder": "1", "x-both": "r" },
            cookies: ["sid=abc; Path=/"],
            body: "ok"
        });
    });
});
