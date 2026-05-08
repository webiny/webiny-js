import { AsyncLocalStorage } from "node:async_hooks";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Webiny stores the current Fastify `request` / `reply` on the shared
 * `app.webiny` context object via `app.webiny.request = request` in
 * `@webiny/handler`'s preHandler. In serverless that's safe because
 * each Lambda invocation runs at most one request through the
 * handler. In a long-lived host two concurrent requests share the
 * same `app.webiny` and clobber each other's `request` / `reply` —
 * symptoms include CMS path/header parameter plugins reading the
 * wrong request's params and `cms.type` ending up null mid-build,
 * causing schema generation to fail with `Unknown type
 * <Model>ListWhereInput` (the per-model plugins get filtered out by
 * the endpoint-pinned isApplicable when type is null).
 *
 * Fix: scope `request` / `reply` per request via AsyncLocalStorage,
 * and patch the Context's accessors so reads always resolve to the
 * ALS-current request even after async awaits. The plain assignment
 * still happens (so any code that reads the property before the ALS
 * scope is established still sees something), but the getter wins
 * inside an ALS scope.
 */

interface RequestScope {
    request: FastifyRequest;
    reply: FastifyReply;
}

const scope = new AsyncLocalStorage<RequestScope>();

const REQUEST_KEY = "request";
const REPLY_KEY = "reply";

const installPerRequestAccessors = (target: object): void => {
    const installed = Reflect.get(target, "__webinyPerRequestAccessorsInstalled");
    if (installed) {
        return;
    }
    Reflect.defineProperty(target, "__webinyPerRequestAccessorsInstalled", {
        value: true,
        enumerable: false,
        writable: false,
        configurable: false
    });

    let assignedRequest: FastifyRequest | undefined;
    let assignedReply: FastifyReply | undefined;

    Reflect.defineProperty(target, REQUEST_KEY, {
        configurable: true,
        enumerable: true,
        get() {
            return scope.getStore()?.request ?? assignedRequest;
        },
        set(v: FastifyRequest) {
            assignedRequest = v;
        }
    });
    Reflect.defineProperty(target, REPLY_KEY, {
        configurable: true,
        enumerable: true,
        get() {
            return scope.getStore()?.reply ?? assignedReply;
        },
        set(v: FastifyReply) {
            assignedReply = v;
        }
    });
};

/**
 * Installs an `onRequest` Fastify hook that wraps the rest of the
 * request lifecycle in an AsyncLocalStorage scope, and patches the
 * Webiny context so `context.request` / `context.reply` resolve to
 * the current request via the scope.
 */
export const installPerRequestContextScope = (app: FastifyInstance): void => {
    const webiny = (app as unknown as { webiny?: object }).webiny;
    if (webiny) {
        installPerRequestAccessors(webiny);
    }

    app.addHook("onRequest", (request, reply, done) => {
        // `enterWith` mutates the current async resource's store
        // rather than nesting a new scope inside a callback. We need
        // it because Fastify continues to subsequent hooks after we
        // call `done()` synchronously — `scope.run(store, cb)` would
        // only keep the store alive while `cb` is executing, and the
        // rest of the request would see an empty store. With
        // `enterWith`, the store stays attached to the current async
        // context for as long as that context lives.
        scope.enterWith({ request, reply });
        done();
    });
};
