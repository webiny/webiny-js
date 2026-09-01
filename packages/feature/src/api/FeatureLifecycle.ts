import { Abstraction, type Container } from "@webiny/di";

/**
 * The per-request context handed to a feature's `setup` / `afterSetup` phases.
 *
 * `container` (the request/child container) is always present. Everything else is supplied by the
 * composition layer when it runs the phases — the established tenant, the resolved feature flags,
 * the identity, and so on.
 *
 * The shape stays open on purpose: this package is a base primitive and must not depend on
 * `@webiny/api-core` types (tenant, FeatureFlags, identity all live there). The api layer narrows
 * it for its own features.
 */
export interface RequestContext {
    container: Container;
    [key: string]: unknown;
}

/**
 * The per-request phases a feature may declare, in the order they run.
 *
 * - `setup`      — the feature's own self-contained per-request setup (tenant is known).
 * - `afterSetup` — work that depends on OTHER features' `setup` having completed.
 *
 * The runner enforces a phase barrier: EVERY feature's `setup` completes before ANY feature's
 * `afterSetup` starts. That is what makes cross-feature dependencies safe without relying on
 * registration order or readiness flags.
 */
export interface FeaturePhases {
    setup?(ctx: RequestContext): void | Promise<void>;
    afterSetup?(ctx: RequestContext): void | Promise<void>;
}

export interface IFeatureLifecycle extends FeaturePhases {
    name: string;
}

/**
 * @internal Plumbing, not a developer-facing concept.
 *
 * Features declare phases through `createFeature({ setup, afterSetup })`. Under the hood the
 * generated `register()` stashes them in the container under this token, so the runner can find
 * them at request time via `resolveAll`. Because nested features are registered with the SAME
 * container as their parent, a feature at any depth is picked up automatically.
 */
export const FeatureLifecycle = new Abstraction<IFeatureLifecycle>("FeatureLifecycle");
