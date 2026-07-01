import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "./RequestContextInitializer.js";

export interface RunRequestContextInitializersOptions {
    /**
     * When true, a failing initializer is logged and skipped instead of aborting the whole run.
     * Use for event categories (e.g. background tasks) that register the full HTTP initializer set
     * but don't need every one — a side-effect initializer that doesn't apply shouldn't fail the task.
     * HTTP keeps the default (fail-fast) so a broken critical initializer surfaces.
     */
    continueOnError?: boolean;
}

/**
 * Runs all registered {@link RequestContextInitializer}s (post-auth per-request setup) against the
 * given container. Call this once per request, AFTER the request's identity/tenant have been
 * established, and BEFORE dispatching to the handler that needs them.
 *
 * Context establishment differs per event category (HTTP establishers, a background task's payload,
 * etc.), but the initializer run itself is identical — so each category invokes this at its own
 * "context established" point (the HTTP layer for all HTTP routes; the bg-task handler for tasks).
 */
export const runRequestContextInitializers = async (
    container: Container,
    options: RunRequestContextInitializersOptions = {}
): Promise<void> => {
    const ctx: Record<string, any> = { container };
    for (const initializer of container.resolveAll(RequestContextInitializer)) {
        try {
            await initializer.init(ctx);
        } catch (err) {
            if (!options.continueOnError) {
                throw err;
            }
            const name = (initializer as any)?.constructor?.name ?? "RequestContextInitializer";
            console.error(`[runRequestContextInitializers] "${name}" failed (continuing):`, err);
        }
    }
};
