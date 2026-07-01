import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "./RequestContextInitializer.js";

/**
 * Runs all registered {@link RequestContextInitializer}s (post-auth per-request setup) against the
 * given container. Call this once per request, AFTER the request's identity/tenant have been
 * established, and BEFORE dispatching to the handler that needs them.
 *
 * Context establishment differs per event category (HTTP establishers, a background task's payload,
 * etc.), but the initializer run itself is identical — so each category invokes this at its own
 * "context established" point (the HTTP layer for all HTTP routes; TaskControl for background tasks).
 */
export const runRequestContextInitializers = async (container: Container): Promise<void> => {
    const ctx: Record<string, any> = { container };
    for (const initializer of container.resolveAll(RequestContextInitializer)) {
        await initializer.init(ctx);
    }
};
