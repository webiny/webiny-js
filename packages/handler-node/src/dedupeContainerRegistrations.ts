import { Container } from "@webiny/di";

let patched = false;

// Symbol-based abstraction tokens whose registered value is genuinely
// per-request (e.g. the current Fastify Request, the per-request CMS
// context). For these, we OVERWRITE the existing registration so
// `resolve` always returns the current request's value. The names
// here must match the strings passed to `createAbstraction(name)` in
// the upstream packages.
const PER_REQUEST_ABSTRACTIONS = new Set<string>([
    // @webiny/handler — current Fastify request
    "Request",
    // @webiny/api-headless-cms — current CMS context (captures
    // request-scoped state via closures)
    "CmsContext",
    // @webiny/handler — current Webiny plugins container instance
    "PluginsContainer"
]);

/**
 * Makes `@webiny/di`'s Container#register* methods idempotent.
 *
 * Why this exists: @webiny/di Container's register methods append to an
 * array per abstraction.token. The Webiny core was designed for the
 * Lambda runtime — every invocation creates a fresh Container, so
 * calling `register` per request is harmless. In a long-lived host
 * (container deployments), the same Container is reused across every
 * HTTP request, so the per-request `createHandlerOnRequest` /
 * `ContextPlugin` registration hooks (api-core, api-aco, api-headless-cms,
 * etc.) accumulate duplicates linearly with uptime. After ~50 requests
 * `resolve` walks 50 copies of every registration; the api becomes
 * progressively unresponsive and eventually appears hung.
 *
 * The fix: skip a register call when the (abstraction, payload) pair is
 * already registered. Distinct payloads against the same abstraction
 * (the multiple-impl pattern, e.g. multiple `OidcIdentityProvider`s)
 * keep working because dedup keys on the payload identity, not the
 * abstraction alone.
 *
 * Idempotent — safe to call from multiple entry points; the first call
 * patches the class, subsequent ones are no-ops.
 */
export const dedupeContainerRegistrations = (): void => {
    if (patched) {
        return;
    }
    patched = true;

    const proto = Container.prototype as unknown as {
        register: (impl: unknown) => unknown;
        registerInstance: (abstraction: unknown, instance: unknown) => void;
        registerFactory: (abstraction: unknown, factory: unknown) => void;
        registerDecorator: (decorator: unknown) => void;
    };

    const originalRegister = proto.register;
    const originalRegisterInstance = proto.registerInstance;
    const originalRegisterFactory = proto.registerFactory;
    const originalRegisterDecorator = proto.registerDecorator;

    // The DI container keeps internal Maps keyed by abstraction.token.
    // We reach into them via the public API to cheaply check membership.
    proto.register = function (this: Container, implementation: unknown) {
        const existing = (
            this as unknown as { registrations: Map<symbol, Array<{ implementation: unknown }>> }
        ).registrations;
        const token = getToken(implementation);
        if (token) {
            const list = existing.get(token);
            if (list?.some(r => r.implementation === implementation)) {
                // Return the existing builder shape so callers chaining
                // `.inSingletonScope()` keep working — they're operating
                // on the live registration that was set the first time.
                return new InertRegistrationBuilder();
            }
        }
        return originalRegister.call(this, implementation);
    };

    // Token-level dedupe (first write wins) for `registerInstance` and
    // `registerFactory`. Webiny's per-request ContextPlugins re-call
    // these with fresh objects every request (e.g.
    // `registerInstance(ModelCache, createMemoryCache())`). In the
    // serverless runtime this is harmless — every Lambda invocation
    // gets a fresh Container, so only the first call ever runs anyway.
    // In a long-lived host the calls accumulate, and worse: singletons
    // that captured the first instance see one cache while singletons
    // constructed later see another — manifesting as silent staleness
    // (e.g., updateModel clears one ModelCache but listModels reads
    // from a different one).
    //
    // Some abstractions are genuinely per-request — `Request` is the
    // current Fastify request — so token-level dedupe would freeze the
    // first request's value forever. Those go through the OVERWRITE
    // path: replace the existing registration so `resolve` always
    // returns the current request's value.
    proto.registerInstance = function (
        this: Container,
        abstraction: unknown,
        instance: unknown
    ): void {
        const token = readAbstractionToken(abstraction);
        const existing = (
            this as unknown as {
                instanceRegistrations: Map<symbol, Array<{ instance: unknown }>>;
            }
        ).instanceRegistrations;
        if (!token) {
            originalRegisterInstance.call(this, abstraction, instance);
            return;
        }
        if (isPerRequest(token)) {
            existing.set(token, [{ instance }]);
            return;
        }
        if (existing.has(token)) {
            return;
        }
        originalRegisterInstance.call(this, abstraction, instance);
    };

    proto.registerFactory = function (
        this: Container,
        abstraction: unknown,
        factory: unknown
    ): void {
        const token = readAbstractionToken(abstraction);
        const existing = (this as unknown as { factories: Map<symbol, Array<unknown>> }).factories;
        if (!token) {
            originalRegisterFactory.call(this, abstraction, factory);
            return;
        }
        if (isPerRequest(token)) {
            existing.set(token, [factory]);
            return;
        }
        if (existing.has(token)) {
            return;
        }
        originalRegisterFactory.call(this, abstraction, factory);
    };

    proto.registerDecorator = function (this: Container, decorator: unknown): void {
        const token = getToken(decorator);
        const existing = (
            this as unknown as { decorators: Map<symbol, Array<{ decoratorClass: unknown }>> }
        ).decorators;
        if (token && existing.get(token)?.some(r => r.decoratorClass === decorator)) {
            return;
        }
        originalRegisterDecorator.call(this, decorator);
    };
};

// `register(impl)` and `registerDecorator(impl)` derive the abstraction
// from `Reflect.getMetadata("wby:abstraction", impl)`. We use the same
// reflect-metadata API to read the token without importing the
// internal Metadata class (it's not exported from @webiny/di).
const ABSTRACTION_KEY = "wby:abstraction";

const getToken = (impl: unknown): symbol | undefined => {
    if (typeof impl !== "function" && typeof impl !== "object") {
        return undefined;
    }
    const reflect = (
        globalThis as {
            Reflect?: { getMetadata?: (key: string, target: unknown) => unknown };
        }
    ).Reflect;
    const abstraction = reflect?.getMetadata?.(ABSTRACTION_KEY, impl) as
        | { token?: symbol }
        | undefined;
    return abstraction?.token;
};

const readAbstractionToken = (abstraction: unknown): symbol | undefined => {
    if (!abstraction || typeof abstraction !== "object") {
        return undefined;
    }
    return (abstraction as { token?: symbol }).token;
};

const isPerRequest = (token: symbol): boolean => {
    const name = token.description;
    return name !== undefined && PER_REQUEST_ABSTRACTIONS.has(name);
};

class InertRegistrationBuilder {
    inSingletonScope(): void {
        // No-op: the original registration's scope was set on the first
        // call. Re-applying it here would mutate the live registration,
        // which we don't want — callers expect "registered once".
    }
}
