import { describe, it, expect } from "vitest";
import { HttpClientError } from "@webiny/event-handler-core";
import { functionUrlEventToHttpRequest } from "~/translators/functionUrlEventToHttpRequest.js";

function event(overrides: Record<string, any> = {}) {
    return {
        version: "2.0",
        routeKey: "$default",
        rawPath: "/stream/fm/files/abc/enrich",
        rawQueryString: "",
        headers: { "content-type": "application/json" },
        requestContext: {
            http: { method: "POST", path: "/stream/fm/files/abc/enrich" },
            requestId: "req-1",
            stage: "$default"
        },
        isBase64Encoded: false,
        ...overrides
    };
}

describe("functionUrlEventToHttpRequest", () => {
    it("should read the method and path", () => {
        const request = functionUrlEventToHttpRequest(event());

        expect(request.method).toBe("POST");
        expect(request.path).toBe("/stream/fm/files/abc/enrich");
    });

    it("should not strip a stage prefix", () => {
        // A Function URL always serves `$default`, so `rawPath` is the real path. Stripping the way the
        // API Gateway translator does would corrupt a route that legitimately starts with the stage name.
        const request = functionUrlEventToHttpRequest(
            event({ rawPath: "/$default/stream/x", requestContext: { http: { method: "GET" } } })
        );

        expect(request.path).toBe("/$default/stream/x");
    });

    it("should default the path when rawPath is empty", () => {
        expect(functionUrlEventToHttpRequest(event({ rawPath: "" })).path).toBe("/");
    });

    describe("cookies", () => {
        it("should fold the cookies array into a cookie header", () => {
            const request = functionUrlEventToHttpRequest(
                event({ cookies: ["theme=dark", "other=1"] })
            );

            expect(request.headers.cookie).toBe("theme=dark; other=1");
        });

        it("should leave headers alone when there are no cookies", () => {
            expect(functionUrlEventToHttpRequest(event()).headers.cookie).toBeUndefined();
            expect(
                functionUrlEventToHttpRequest(event({ cookies: [] })).headers.cookie
            ).toBeUndefined();
        });
    });

    describe("query string", () => {
        it("should prefer the pre-parsed map", () => {
            const request = functionUrlEventToHttpRequest(
                event({ queryStringParameters: { a: "1" }, rawQueryString: "b=2" })
            );

            expect(request.query).toEqual({ a: "1" });
        });

        it("should parse rawQueryString when the map is absent", () => {
            const request = functionUrlEventToHttpRequest(event({ rawQueryString: "a=1&b=two" }));

            expect(request.query).toEqual({ a: "1", b: "two" });
        });

        it("should return an empty object for a query-less request", () => {
            expect(functionUrlEventToHttpRequest(event()).query).toEqual({});
        });
    });

    describe("body", () => {
        it("should parse a JSON body", () => {
            const request = functionUrlEventToHttpRequest(event({ body: '{"a":1}' }));

            expect(request.body).toEqual({ a: 1 });
        });

        it("should fall back to the raw string when the body isn't JSON", () => {
            const request = functionUrlEventToHttpRequest(event({ body: "not json" }));

            expect(request.body).toBe("not json");
        });

        it("should not parse a JSON-looking body sent as text/plain", () => {
            const request = functionUrlEventToHttpRequest(
                event({ headers: { "content-type": "text/plain" }, body: '{"a":1}' })
            );

            expect(request.body).toBe('{"a":1}');
        });

        it("should not parse a body sent without a content type", () => {
            const request = functionUrlEventToHttpRequest(event({ headers: {}, body: '{"a":1}' }));

            expect(request.body).toBe('{"a":1}');
        });

        it.each([
            ["a __proto__ key", '{"__proto__":{"polluted":true}}'],
            ["a nested __proto__ key", '{"a":{"__proto__":{"polluted":true}}}'],
            ["a constructor.prototype key", '{"constructor":{"prototype":{"polluted":true}}}']
        ])("should refuse a JSON body with %s with a 400", (_, body) => {
            const translate = () => functionUrlEventToHttpRequest(event({ body }));

            expect(translate).toThrow(HttpClientError);
            expect(translate).toThrow(expect.objectContaining({ statusCode: 400 }));
            expect(({} as any).polluted).toBeUndefined();
        });

        it("should refuse a base64 JSON body with a __proto__ key with a 400", () => {
            const translate = () =>
                functionUrlEventToHttpRequest(
                    event({
                        isBase64Encoded: true,
                        body: Buffer.from('{"__proto__":{"polluted":true}}').toString("base64")
                    })
                );

            expect(translate).toThrow(expect.objectContaining({ statusCode: 400 }));
        });

        it("should be undefined when there is no body", () => {
            expect(functionUrlEventToHttpRequest(event()).body).toBeUndefined();
        });

        it("should decode a base64 JSON body", () => {
            const request = functionUrlEventToHttpRequest(
                event({
                    body: Buffer.from('{"a":1}').toString("base64"),
                    isBase64Encoded: true
                })
            );

            expect(request.body).toEqual({ a: 1 });
        });

        it("should decode a base64 text body", () => {
            const request = functionUrlEventToHttpRequest(
                event({
                    headers: { "content-type": "text/plain" },
                    body: Buffer.from("hello").toString("base64"),
                    isBase64Encoded: true
                })
            );

            expect(request.body).toBe("hello");
        });

        it("should keep a base64 binary body as raw bytes", () => {
            // Decoding arbitrary bytes as utf8 would corrupt them, so anything not declared as text
            // stays a Buffer.
            const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
            const request = functionUrlEventToHttpRequest(
                event({
                    headers: { "content-type": "application/octet-stream" },
                    body: bytes.toString("base64"),
                    isBase64Encoded: true
                })
            );

            expect(Buffer.isBuffer(request.body)).toBe(true);
            expect([...(request.body as Buffer)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
        });
    });
});
