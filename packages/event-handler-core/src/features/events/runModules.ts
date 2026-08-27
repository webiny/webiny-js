import type { Container } from "@webiny/di";
import { Module } from "./Module.js";

export interface RunModulesOptions {
    /**
     * When true, a failing phase callback is logged and skipped instead of aborting the whole run.
     * (Matches the current `runRequestContextInitializers` behaviour for event categories — e.g.
     * background tasks — that register the full module set but don't need every one.)
     */
    continueOnError?: boolean;
}

/**
 * Runs all registered {@link Module}s' per-request phases against the container, PHASE BY PHASE:
 * every module's `setup` first, then every module's `afterSetup`. The phase barrier is the point —
 * an `afterSetup` is guaranteed to run only once EVERY module's `setup` has completed, so
 * cross-module dependencies (a dependency graph built from other modules' registrations) are safe.
 *
 * Call once per request, AFTER the request's tenant/identity are established and BEFORE dispatching
 * to the handler.
 */
export const runModules = async (
    container: Container,
    options: RunModulesOptions = {}
): Promise<void> => {
    const ctx: Record<string, any> = { container };
    const modules = container.resolveAll(Module);

    const runPhase = async (phase: "setup" | "afterSetup"): Promise<void> => {
        for (const module of modules) {
            const run = module[phase];
            if (!run) {
                continue;
            }
            try {
                await run.call(module, ctx);
            } catch (err) {
                if (!options.continueOnError) {
                    throw err;
                }
                const name = (module as any)?.constructor?.name ?? "Module";
                console.error(`[runModules] "${name}.${phase}" failed (continuing):`, err);
            }
        }
    };

    // Phase barrier: ALL setups complete before ANY afterSetup runs.
    await runPhase("setup");
    await runPhase("afterSetup");
};
