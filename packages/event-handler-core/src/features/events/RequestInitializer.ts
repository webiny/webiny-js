import { Abstraction } from "@webiny/di";

/**
 * Per-request async initialization hook. Runs once per request, after the request container is set
 * up (options.child) and BEFORE the event is dispatched to its handler chain — i.e. before
 * auth/tenant are established.
 *
 * Use it for async, tenant-agnostic, per-request setup that must be ready before synchronous
 * consumers run, and that can change between requests (e.g. loading the WCP project license).
 *
 * - For tenant/identity-dependent state, use a lazy DI factory instead (resolved during request
 *   handling, after auth has run).
 * - For build-once async setup (a process-lifetime singleton), use a RootInitializer.
 *
 * Multiple initializers may be registered; they run in registration order.
 */
export interface IRequestInitializer {
    init(): void | Promise<void>;
}

export const RequestInitializer = new Abstraction<IRequestInitializer>("RequestInitializer");

export namespace RequestInitializer {
    export type Interface = IRequestInitializer;
}
