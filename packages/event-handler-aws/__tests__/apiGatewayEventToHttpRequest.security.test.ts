/**
 * SECURITY: prototype pollution in apiGatewayEventToHttpRequest (CWE-1321).
 *
 * A JSON body is parsed with `parseJson` (secure-json-parse). A `__proto__` or
 * `constructor.prototype` key is refused with a 400 `HttpClientError`, so such a key can never reach
 * a recursive merge downstream. Only `application/json` bodies are parsed; malformed JSON stays the
 * raw string and the route decides what to do with it.
 */

import { describe, it, expect, afterEach } from "vitest";
import { HttpClientError } from "@webiny/event-handler-core";
import { apiGatewayEventToHttpRequest } from "~/translators/apiGatewayEventToHttpRequest.js";

const baseV1Event = {
    httpMethod: "POST",
    path: "/graphql",
    headers: { "content-type": "application/json" },
    queryStringParameters: {},
    pathParameters: {},
    requestContext: { requestId: "req-1" }
};

const baseV2Event = {
    rawPath: "/graphql",
    headers: { "content-type": "application/json" },
    queryStringParameters: {},
    pathParameters: {},
    requestContext: { stage: "$default", http: { method: "POST" } }
};

describe("apiGatewayEventToHttpRequest — security", () => {
    afterEach(() => {
        delete (Object.prototype as any).isAdmin;
        delete (Object.prototype as any).polluted;
    });

    describe("prototype pollution via __proto__", () => {
        it.each([
            ["v1", '{"__proto__":{"isAdmin":true}}'],
            ["v1 nested", '{"query":"{ a }","variables":{"__proto__":{"isAdmin":true}}}']
        ])("%s: refuses a __proto__ key with a 400", (_, payload) => {
            const parse = () => apiGatewayEventToHttpRequest({ ...baseV1Event, body: payload });

            expect(parse).toThrow(HttpClientError);
            expect(parse).toThrow(expect.objectContaining({ statusCode: 400 }));
            expect(({} as any).isAdmin).toBeUndefined();
        });

        it("v2: refuses a __proto__ key with a 400", () => {
            const payload = '{"__proto__":{"polluted":"yes"}}';
            const parse = () => apiGatewayEventToHttpRequest({ ...baseV2Event, body: payload });

            expect(parse).toThrow(expect.objectContaining({ statusCode: 400 }));
            expect(({} as any).polluted).toBeUndefined();
        });
    });

    describe("prototype pollution via constructor.prototype", () => {
        it("refuses a constructor.prototype key with a 400", () => {
            const payload = JSON.stringify({
                constructor: { prototype: { pwned: true } }
            });
            const parse = () => apiGatewayEventToHttpRequest({ ...baseV1Event, body: payload });

            expect(parse).toThrow(expect.objectContaining({ statusCode: 400 }));
        });
    });

    describe("content type", () => {
        it("does not parse a JSON-looking body sent as text/plain", () => {
            const payload = '{"query":"{ a }"}';
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                headers: { "content-type": "text/plain" },
                body: payload
            });

            expect(request.body).toBe(payload);
        });

        it("parses a body sent as application/json with a charset, whatever the header casing", () => {
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                headers: { "Content-Type": "Application/JSON; charset=utf-8" },
                body: '{"a":1}'
            });

            expect(request.body).toEqual({ a: 1 });
        });
    });

    describe("no body size or depth limit", () => {
        it("accepts arbitrarily deeply nested JSON without error", () => {
            const depth = 10_000;
            const open = "[".repeat(depth);
            const close = "]".repeat(depth);
            const payload = `${open}1${close}`;

            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: payload
            });

            expect(request.body).toBeDefined();

            let cursor = request.body;
            for (let i = 0; i < depth; i++) {
                cursor = cursor[0];
            }
            expect(cursor).toBe(1);
        });

        it("accepts payload with excessive key count (hash-flood vector)", () => {
            const keyCount = 100_000;
            const obj: Record<string, number> = {};
            for (let i = 0; i < keyCount; i++) {
                obj[`k${i}`] = i;
            }

            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: JSON.stringify(obj)
            });

            expect(Object.keys(request.body).length).toBe(keyCount);
        });
    });

    describe("malformed JSON", () => {
        it("passes malformed JSON through as the raw string", () => {
            const malformed = '{"key": "value"';
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: malformed
            });

            // The route decides: the GraphQL route answers a string body with a 400.
            expect(typeof request.body).toBe("string");
            expect(request.body).toBe(malformed);
        });
    });
});
