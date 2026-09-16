# Security Audit: Event Handler Attack Surface

**Date:** 2026-07-27
**Packages:** `event-handler-aws`, `event-handler-core`, `api-event-handler-aws`
**Findings:** 6 (1 high, 2 medium, 3 low)
**Tests:** 6 (proving finding #1)

---

## Audit Scope

- `packages/event-handler-aws/src/` — Lambda transport, event types, translators, handlers
- `packages/event-handler-core/src/` — HTTP abstractions, event handler interfaces
- `packages/api-event-handler-aws/src/` — Identity & tenant loader decorators

---

## Finding #1 — Prototype Pollution via Unsanitized JSON.parse

**Severity:** High
**CWE:** CWE-1321 — Improperly Controlled Modification of Object Prototype Attributes
**Status:** Proven with tests
**File:** `event-handler-aws/src/translators/apiGatewayEventToHttpRequest.ts:17`

### Problem

`JSON.parse(event.body)` runs with no sanitization. An attacker sends `{"__proto__":{"isAdmin":true}}` as the request body. `JSON.parse` creates `__proto__` as an **own property** on the result object.

When any downstream code recursively merges this object — `lodash.merge`, `deepmerge`, GraphQL context assembly, custom config builders — it walks into `target["__proto__"]`, which resolves to `Object.prototype` via the getter. The attacker's keys are now on **every object in the runtime**.

### Attack Flow

```
Attacker HTTP body → JSON.parse → request.body → recursive merge → Object.prototype polluted
(raw JSON string)    (__proto__     (passed          (lodash.merge     (all objects
                      own prop)     downstream)       etc)              affected)
```

### Proven Attack Vectors

All proven with tests in `event-handler-aws/__tests__/apiGatewayEventToHttpRequest.security.test.ts`:

1. **`__proto__` pollution** (v1 + v2 event formats) — global `Object.prototype` poisoned via recursive merge
2. **`constructor.prototype` pollution** — alternate path, same outcome
3. **Deep nesting** (10,000 levels) — downstream recursive processors stack-overflow
4. **Excessive key count** (100k keys) — hash-flood DoS
5. **Silent error swallowing** — malformed JSON becomes raw string with no error signal, causing type confusion downstream

### Recommended Fix (Option A — preferred): `secure-json-parse`

Battle-tested drop-in for `JSON.parse`. Zero dependencies, ~2 KB. Used by Fastify (billions of requests/day).

```bash
yarn workspace @webiny/event-handler-aws add secure-json-parse
```

```ts
import sjson from "secure-json-parse";

// In apiGatewayEventToHttpRequest.ts:
if (event.body) {
    try {
        body = sjson.parse(event.body, undefined, {
            protoAction: "remove",       // strips __proto__ keys
            constructorAction: "remove"  // strips constructor keys
        });
    } catch {
        body = event.body;
    }
}
```

`protoAction` / `constructorAction` accept `"remove"` (silent strip), `"error"` (throw on detection), or `"ignore"` (default — current behavior).

### Recommended Fix (Option B — zero dependencies): JSON.parse reviver

```ts
function safeParse(raw: string): unknown {
    return JSON.parse(raw, (key, value) => {
        if (key === "__proto__" || key === "constructor") {
            return undefined;
        }
        return value;
    });
}
```

The reviver runs bottom-up for every key, so nested paths like `{"a":{"__proto__":{"x":1}}}` are caught.

**Caveat:** The reviver strips ALL `constructor` keys, including legitimate ones. `secure-json-parse` only strips `constructor` when it contains a `prototype` sub-key — more precise.

---

## Finding #2 — Internal Error Details Leaked to HTTP Response

**Severity:** Medium
**CWE:** CWE-209 — Generation of Error Message Containing Sensitive Information
**File:** `event-handler-aws/src/handlers/ApiGatewayHttpRouterHandler.ts:23-31`

### Problem

When a route handler throws an error with a `code` property, the catch block returns `message`, `code`, and `data` verbatim in the 500 response body. Stack traces, database error codes, and internal data structures reach the attacker, aiding further exploitation.

```ts
// Current: leaks internals
return httpResponseToApiGatewayResult({
    statusCode: 500,
    body: {
        message: (e as any).message,  // ← may contain SQL, stack trace
        code: (e as any).code,        // ← internal error taxonomy
        data: (e as any).data ?? null  // ← arbitrary internal data
    }
});
```

### Recommended Fix

Log full error server-side. Return only a generic message to the client.

```ts
catch (e) {
    console.error("HTTP handler error:", e);
    return httpResponseToApiGatewayResult({
        statusCode: 500,
        body: { message: "Internal server error" }
    });
}
```

---

## Finding #3 — Tenant Header Trusted Without Validation

**Severity:** Medium
**CWE:** CWE-20 — Improper Input Validation
**File:** `api-event-handler-aws/src/handlers/ApiGatewayTenantLoaderDecorator.ts:27`

### Problem

The `x-tenant` header value is read and passed to `RawTenantId.set()` with no format validation, length limit, or character restriction. If downstream code uses this value in database queries, path construction, or cache keys without its own sanitization, it becomes an injection vector. Header spoofing is trivial — no authentication is required to set arbitrary headers.

```ts
// Current: no validation
this.rawTenantId.set(
    headers ? (headers["x-tenant"] ?? headers["X-Tenant"] ?? null) : null
);
```

### Recommended Fix

Validate tenant ID against expected format before passing downstream.

```ts
const TENANT_RE = /^[a-zA-Z0-9_-]{1,64}$/;

const raw = headers?.["x-tenant"] ?? headers?.["X-Tenant"] ?? null;
const tenantId = raw && TENANT_RE.test(raw) ? raw : null;
this.rawTenantId.set(tenantId);
```

---

## Finding #4 — No Auth Token Length or Character Validation

**Severity:** Low
**CWE:** CWE-20 — Improper Input Validation
**File:** `api-event-handler-aws/src/handlers/ApiGatewayIdentityLoaderDecorator.ts:47-55`

Bearer token extracted via regex and passed to the identity loader with no upper bound on length or character set restriction. An oversized token (multi-MB) could cause memory pressure in the auth pipeline. Impact depends on downstream identity loader implementation.

---

## Finding #5 — Open Index Signature on WebSocket Event Interface

**Severity:** Low
**CWE:** CWE-1321
**File:** `event-handler-aws/src/eventTypes/WebSocketEventType.ts:13`

`IWebSocketEvent.requestContext` declares `[key: string]: unknown`, accepting arbitrary keys. Combined with body parsing (body is `string | Record<string, unknown>`), same prototype pollution class applies if body is ever JSON.parsed downstream. TypeScript won't flag pollution-prone keys at compile time.

---

## Finding #6 — Raw Lambda Event Registered into DI Container

**Severity:** Low
**CWE:** CWE-20 — Improper Input Validation
**File:** `event-handler-aws/src/AwsLambdaTransport.ts:19`

The entire unsanitized Lambda event is registered as `AwsLambdaEvent` in the DI container. Every consumer that resolves this abstraction receives attacker-controlled body, headers, query params, and path parameters with no trust boundary. This is the systemic root of findings #1, #3, and #4 — sanitization should happen at registration, not per-consumer.

---

## Priority

| Priority | Finding | Action |
|----------|---------|--------|
| **High** | #1 Prototype pollution | Exploitable now. Proven with tests. Fix first. |
| **Medium** | #2 Error leakage | Information disclosure aids further attacks. Quick fix. |
| **Medium** | #3 Tenant header | Depends on downstream validation. Validate at boundary. |
| **Low** | #4 #5 #6 | Require specific downstream conditions. Address in hardening pass. |

---

## Test Coverage

Six security tests in `event-handler-aws/__tests__/apiGatewayEventToHttpRequest.security.test.ts` proving all five attack vectors for Finding #1.

```bash
yarn test packages/event-handler-aws
```
