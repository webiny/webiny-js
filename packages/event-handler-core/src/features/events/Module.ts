import { Abstraction, type Container } from "@webiny/di";

/**
 * The per-request context handed to a module's phases. `container` (the child container) is always
 * present. Everything else is supplied by the composition layer (api-event-handler-core) when it
 * calls `runModules` — the established tenant, the resolved FeatureFlags, the identity, etc.
 *
 * It stays open here on purpose: event-handler-core is the transport/domain-agnostic request kernel
 * and must not depend on api-core types (tenant, FeatureFlags, identity live there). The api layer
 * narrows this shape for its own modules.
 */
export interface ModuleContext {
    container: Container;
    [key: string]: unknown;
}

/**
 * A per-request, POST-auth lifecycle unit with ORDERED PHASES. Prototype of the `Module` concept:
 * a developer declares *which phase* a piece of setup runs in, and the framework runs ALL modules'
 * phase-N before ANY module's phase-N+1 — so a module's `afterSetup` can safely depend on every
 * other module's `setup` having completed.
 *
 * This solves the "one phase isn't enough" problem: today `RequestContextInitializer` is a single
 * post-auth pass, so work that depends on OTHER features' setup (bulk actions / background tasks
 * resolving a dependency graph) runs too early. Splitting into `setup` (self-contained) and
 * `afterSetup` (cross-feature) makes the ordering explicit instead of relying on registration order
 * + lazy resolution.
 *
 * Phase 1 ("register" — immediate, synchronous DI wiring) stays where it is today: `Feature.register`.
 * `Module` covers only the per-request phases:
 *
 * - `setup`      — self-contained per-request setup (≈ today's RequestContextInitializer).
 * - `afterSetup` — work that depends on other modules' `setup` (the missing phase).
 *
 * Both are optional; a module implements whichever phases it needs. Modules run in registration
 * order within a phase.
 */
export interface IModule {
    setup?(ctx: ModuleContext): void | Promise<void>;
    afterSetup?(ctx: ModuleContext): void | Promise<void>;
}

export const Module = new Abstraction<IModule>("Module");

export namespace Module {
    export type Interface = IModule;
}
