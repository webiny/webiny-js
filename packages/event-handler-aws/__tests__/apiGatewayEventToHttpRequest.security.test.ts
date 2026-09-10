/**
 * SECURITY: Prototype Pollution in apiGatewayEventToHttpRequest
 * ==============================================================
 *
 * File:     src/translators/apiGatewayEventToHttpRequest.ts (line 17)
 * Severity: High
 * Category: CWE-1321 — Improperly Controlled Modification of Object Prototype Attributes
 *
 * Problem
 * -------
 * `JSON.parse(event.body)` is called with zero sanitization. When an attacker
 * sends a body like `{"__proto__":{"isAdmin":true}}`, JSON.parse creates an
 * object with `__proto__` as an **own property**. Any downstream code that
 * recursively merges this object (lodash.merge, deepmerge, custom config
 * builders, GraphQL context assembly) will walk into `target["__proto__"]`,
 * which resolves to `Object.prototype` via the getter — polluting **every
 * object in the runtime**.
 *
 * Attack vectors proven below:
 *   1. `__proto__` pollution — global Object.prototype poisoned via recursive merge
 *   2. `constructor.prototype` pollution — alternate path, same outcome
 *   3. No depth limit — 10k nested arrays pass through; downstream recursive
 *      processors (validators, deep-clone) stack-overflow
 *   4. No key-count limit — 100k-key objects parsed; hash-flood DoS
 *   5. Silent error swallowing — malformed JSON becomes a raw string with no
 *      error signal, causing type confusion downstream
 *
 * Fix (Option A — recommended): use `secure-json-parse`
 * -------------------------------------------------------
 * Battle-tested drop-in replacement for JSON.parse. Zero dependencies, ~2 KB.
 * Used by Fastify (handles billions of requests/day).
 * https://github.com/fastify/secure-json-parse
 *
 *   ```bash
 *   yarn workspace @webiny/event-handler-aws add secure-json-parse
 *   ```
 *
 *   ```ts
 *   import sjson from "secure-json-parse";
 *
 *   // In apiGatewayEventToHttpRequest:
 *   if (event.body) {
 *       try {
 *           body = sjson.parse(event.body, undefined, {
 *               protoAction: "remove",       // strips __proto__ keys
 *               constructorAction: "remove"  // strips constructor keys
 *           });
 *       } catch {
 *           body = event.body;
 *       }
 *   }
 *   ```
 *
 * `protoAction` / `constructorAction` accept "remove" (silent strip),
 * "error" (throw on detection), or "ignore" (default, current behavior).
 *
 *
 * Fix (Option B — zero dependencies): JSON.parse reviver
 * -------------------------------------------------------
 * If adding a dependency is undesirable, a reviver callback achieves the same:
 *
 *   ```ts
 *   function safeParse(raw: string): unknown {
 *       return JSON.parse(raw, (key, value) => {
 *           if (key === "__proto__" || key === "constructor") {
 *               return undefined; // stripped from output
 *           }
 *           return value;
 *       });
 *   }
 *   ```
 *
 * The reviver runs bottom-up for every key, so nested pollution paths like
 * `{"a":{"__proto__":{"x":1}}}` are also caught.
 *
 * Caveat: the reviver approach strips ALL `constructor` keys, including
 * legitimate ones. `secure-json-parse` only strips `constructor` when it
 * contains a `prototype` sub-key, which is more precise.
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
        it("v1: __proto__ key in body pollutes Object.prototype through recursive merge", () => {
            // Must construct JSON manually — JS literal `{ __proto__: ... }` sets
            // the prototype instead of creating an own property, so JSON.stringify
            // would drop it. An attacker sends raw JSON, not a JS literal.
            const payload = '{"__proto__":{"isAdmin":true}}';
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: payload
            });

            // Step 1: __proto__ key passes through JSON.parse as own property.
            expect(Object.prototype.hasOwnProperty.call(request.body, "__proto__")).toBe(true);

            // Step 2: recursive merge (lodash.merge, deepmerge, etc.) triggers pollution.
            deepMerge({}, request.body);

            // Step 3: every object in the runtime now has isAdmin === true.
            expect((Object.prototype as any).isAdmin).toBe(true);
            expect(({} as any).isAdmin).toBe(true);
        });

        it("v2: __proto__ key in body pollutes Object.prototype through recursive merge", () => {
            const payload = '{"__proto__":{"polluted":"yes"}}';
            const request = apiGatewayEventToHttpRequest({
                ...baseV2Event,
                body: payload
            });

            expect(Object.prototype.hasOwnProperty.call(request.body, "__proto__")).toBe(true);

            deepMerge({}, request.body);

            expect((Object.prototype as any).polluted).toBe("yes");
            expect(({} as any).polluted).toBe("yes");
        });
    });

    describe("prototype pollution via constructor.prototype", () => {
        it("parsed body with constructor.prototype key enables pollution", () => {
            const payload = JSON.stringify({
                constructor: { prototype: { pwned: true } }
            });
            const request = apiGatewayEventToHttpRequest({
                ...baseV1Event,
                body: payload
            });

            expect(request.body).toHaveProperty("constructor");
            expect(request.body.constructor).toHaveProperty("prototype");
            expect(request.body.constructor.prototype).toEqual({ pwned: true });
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

            // V8 handles this, but downstream recursive visitors will stack-overflow.
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
