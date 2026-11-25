/**
 * SECURITY: Prototype pollution in apiGatewayEventToHttpRequest (CWE-1321)
 *
 * The translator parses request bodies with `parseJsonBody`, which refuses a `__proto__` or
 * `constructor.prototype` key. Such a body is not parsed: it stays the raw string, so a recursive
 * merge further down can't reach `Object.prototype` through it. The GraphQL route then answers 400
 * for a body that isn't a JSON object.
 */

import { describe, it, expect, afterEach } from "vitest";
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

/**
 * Simulates a recursive merge — a common pattern in config builders, GraphQL
 * context assembly, and libraries like lodash.merge / deepmerge.
 * This is the pattern that turns a __proto__ own-property key into global
 * prototype pollution.
 */
function deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
        if (
            typeof source[key] === "object" &&
            source[key] !== null &&
            typeof target[key] === "object" &&
            target[key] !== null
        ) {
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

describe("apiGatewayEventToHttpRequest — security", () => {
    afterEach(() => {
        delete (Object.prototype as any).isAdmin;
        delete (Object.prototype as any).polluted;
    });

    describe("prototype pollution via __proto__", () => {
        it("v1: a __proto__ key leaves the body unparsed, so a recursive merge can't pollute", () => {
            // Must construct JSON manually — JS literal `{ __proto__: ... }` sets
            // the prototype instead of creating an own property, so JSON.stringify
            // would drop it. An attacker sends raw JSON, not a JS literal.
            const payload = '{"__proto__":{"isAdmin":true}}';
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: payload
            });

            expect(request.body).toBe(payload);

            deepMerge({}, request.body);

            expect((Object.prototype as any).isAdmin).toBeUndefined();
            expect(({} as any).isAdmin).toBeUndefined();
        });

        it("v2: a __proto__ key leaves the body unparsed, so a recursive merge can't pollute", () => {
            const payload = '{"__proto__":{"polluted":"yes"}}';
            const request = apiGatewayEventToHttpRequest({
                ...baseV2Event,
                body: payload
            });

            expect(request.body).toBe(payload);

            deepMerge({}, request.body);

            expect((Object.prototype as any).polluted).toBeUndefined();
            expect(({} as any).polluted).toBeUndefined();
        });
    });

    describe("prototype pollution via constructor.prototype", () => {
        it("a constructor.prototype key leaves the body unparsed", () => {
            const payload = JSON.stringify({
                constructor: { prototype: { pwned: true } }
            });
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: payload
            });

            expect(request.body).toBe(payload);
        });

        it("still parses a constructor key without a prototype", () => {
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: JSON.stringify({ constructor: "Ford" })
            });

            expect(request.body).toEqual({ constructor: "Ford" });
        });
    });

    describe("no body size or depth limit", () => {
        it("doesn't throw on arbitrarily deeply nested JSON", () => {
            const depth = 10_000;
            const payload = `${"[".repeat(depth)}1${"]".repeat(depth)}`;

            // Parsing this deep may exceed the call stack; the body then stays the raw string.
            expect(() => {
                apiGatewayEventToHttpRequest({ ...baseV1Event, body: payload });
            }).not.toThrow();
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

    describe("silent error swallowing", () => {
        it("passes malformed JSON through as raw string — no error signal", () => {
            const malformed = '{"key": "value"';
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: malformed
            });

            // Downstream code expecting object gets string. No error, no flag.
            expect(typeof request.body).toBe("string");
            expect(request.body).toBe(malformed);
        });
    });
});
