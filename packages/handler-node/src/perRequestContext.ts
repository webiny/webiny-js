import { AsyncLocalStorage } from "node:async_hooks";
import type { FastifyInstance } from "fastify";
import { enterIdentityRequestScope } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { enterAuthorizationRequestScope } from "@webiny/api-core/features/security/authorization/AuthorizationContext/index.js";

/**
 * Per-request context isolation for long-lived hosts.
 *
 * Webiny was designed for the AWS Lambda runtime: every invocation
 * gets a fresh `app.webiny` context, a fresh `PluginsContainer`, and a
 * fresh DI container. Plugins assume they own those objects for the
 * duration of "the request" and freely mutate them — assigning
 * `context.cms = {...}`, `context.security = ...`, `context.cms.type
 * = "manage"`, etc. In a long-lived process serving concurrent traffic
 * the same `app.webiny` object is shared; concurrent requests trample
 * each other's mutations and the result is impossible-to-debug
 * "endpoint=null" / "Unknown type" / "Unauthenticated" errors.
 *
 * The fix is to back every per-request context property with
 * `AsyncLocalStorage`. Each property is exposed as a getter/setter on
 * the shared `app.webiny` object: reads pull from the ALS store of the
 * currently-executing request, writes go to the same store. Outside an
 * ALS scope (boot-time code, background tasks not triggered by an HTTP
 * request) the original "shared field" semantics are preserved via a
 * fallback slot.
 *
 * The list of per-request fields below is the audit output across the
 * Webiny API packages used by the container. It is finite — Webiny
 * doesn't add per-request fields lightly — and the concurrent stress
 * test in CI catches any new ones that get introduced.
 */

// Properties that are LEGITIMATELY per-request. Assignments to these
// inside ContextPlugins / RegisterExtensionPlugins must NOT leak
// across concurrent requests. The audit (Phase 1) enumerated them
// from Webiny's source; new entries are added here when CI's
// concurrent stress test catches a regression.
//
// Keep this list manually curated and deduped. Avoid `plugins`,
// `container`, `routes`, `WEBINY_VERSION`, `benchmark`, `wcp` (the
// new feature, distinct from the legacy `wcp` field below) — those
// are boot-time singletons or are managed independently.
const PER_REQUEST_FIELDS = [
    // @webiny/handler — per-request Fastify objects
    "request",
    "reply",
    // @webiny/api-core (legacy bridges, all assigned per ContextPlugin)
    "security",
    "tenancy",
    "adminUsers",
    "wcp",
    // @webiny/api-headless-cms — `context.cms` is replaced wholesale
    // per request and its internal `type/READ/PREVIEW/MANAGE` flags
    // are mutated mid-request by `setSchemaType`. Scoping the whole
    // object means the inner mutations stay confined to the request
    // that initiated them.
    "cms",
    // @webiny/api-aco
    "aco",
    // @webiny/api-audit-logs
    "auditLogs",
    // @webiny/api-websockets
    "websockets",
    // @webiny/tasks
    "tasks",
    // @webiny/handler-db / extensions/api in-memory db
    "db",
    // @webiny/handler-graphql per-request debug log buffer
    "debug"
] as const;

type RequestStore = Record<string, unknown>;

const scope = new AsyncLocalStorage<RequestStore>();

const PATCH_MARKER = "__webinyPerRequestAccessorsInstalled" as const;

/**
 * Patches the shared context object's per-request properties to read
 * from / write to the ALS store. Idempotent.
 */
const installPerRequestAccessors = (target: object): void => {
    if (Reflect.get(target, PATCH_MARKER)) {
        return;
    }
    Reflect.defineProperty(target, PATCH_MARKER, {
        value: true,
        enumerable: false,
        writable: false,
        configurable: false
    });

    // Fallback storage for assignments that happen outside any
    // request scope (e.g. boot, background tasks). Each key gets its
    // own slot so unrelated assignments don't collide.
    const fallback: Record<string, unknown> = {};

    for (const key of PER_REQUEST_FIELDS) {
        // Capture the value that may already be on the target
        // (e.g. set during Context construction) so we don't drop it.
        if (key in target) {
            fallback[key] = Reflect.get(target, key);
        }

        Reflect.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get() {
                const store = scope.getStore();
                if (store && key in store) {
                    return store[key];
                }
                return fallback[key];
            },
            set(value: unknown) {
                const store = scope.getStore();
                if (store) {
                    store[key] = value;
                    return;
                }
                fallback[key] = value;
            }
        });
    }
};

/**
 * Installs an `onRequest` Fastify hook that opens an
 * AsyncLocalStorage scope for the rest of the request lifecycle, and
 * patches the Webiny context's per-request properties to resolve via
 * that scope.
 *
 * Uses `scope.enterWith` (rather than `scope.run`) because Fastify's
 * hook chain continues asynchronously after we call `done()`; we need
 * the store attached to the current async resource so subsequent
 * hooks (preHandler, ContextPlugins, route handlers) inherit it.
 */
export const installPerRequestContextScope = (app: FastifyInstance): void => {
    const webiny = (app as unknown as { webiny?: object }).webiny;
    if (webiny) {
        installPerRequestAccessors(webiny);
    }

    app.addHook("onRequest", (_request, _reply, done) => {
        // Open the per-request scopes BEFORE Webiny's preHandler runs.
        // Empty stores are fine — Webiny's preHandler will populate
        // request/reply, downstream ContextPlugins populate the rest.
        // The important bit is that a NEW store exists for every
        // request so writes don't leak across concurrent requests.
        scope.enterWith({});
        // Open per-request scopes inside Webiny's stateful security
        // singletons so identity / permission cache writes from this
        // request stay confined to it.
        enterIdentityRequestScope();
        enterAuthorizationRequestScope();
        done();
    });
};
