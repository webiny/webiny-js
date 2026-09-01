import type { Container } from "@webiny/di";
import { FeatureLifecycle, type RequestContext } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";

export interface RunFeaturePhasesOptions {
    /**
     * When true, a failing phase is logged and skipped instead of aborting the whole run. Matches
     * the current per-path behaviour: HTTP fails fast (a broken setup is a 500), while background
     * tasks and scheduled actions register the full feature set but don't need every phase to
     * succeed.
     */
    continueOnError?: boolean;
    /**
     * Per-request state merged into the {@link RequestContext} handed to each phase — the seam for
     * the caller to pass the established tenant, the resolved feature flags, the identity, etc.
     */
    context?: Record<string, unknown>;
}

/**
 * Runs every registered feature's per-request phases, PHASE BY PHASE: all `setup` first, then all
 * `afterSetup`.
 *
 * The phase barrier is the point — an `afterSetup` runs only once EVERY feature's `setup` has
 * completed, so work that depends on other features (a dependency graph, a GraphQL schema built
 * from every feature's models) is guaranteed to see a complete picture. No registration-order
 * comments, no readiness flags.
 *
 * Call once per request, AFTER the tenant is established and BEFORE dispatching to the handler.
 */
export const runFeaturePhases = async (
    container: Container,
    options: RunFeaturePhasesOptions = {}
): Promise<void> => {
    const entries = container.resolveAll(FeatureLifecycle);
    if (entries.length === 0) {
        return;
    }

    const ctx: RequestContext = { container, ...options.context };

    const runPhase = async (phase: "setup" | "afterSetup"): Promise<void> => {
        for (const entry of entries) {
            const run = entry[phase];
            if (!run) {
                continue;
            }

            try {
                await run.call(entry, ctx);
            } catch (error) {
                if (!options.continueOnError) {
                    throw error;
                }
                container
                    .resolve(Logger)
                    .warn({ error }, `Feature "${entry.name}.${phase}" failed; continuing.`);
            }
        }
    };

    // Phase barrier: ALL setups complete before ANY afterSetup runs.
    await runPhase("setup");
    await runPhase("afterSetup");
};
