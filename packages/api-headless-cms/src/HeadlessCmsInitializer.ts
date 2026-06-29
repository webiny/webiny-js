import type { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { CmsContext as CmsContextAbstraction } from "~/features/shared/abstractions.js";
import type { ApiEndpoint, CmsContext } from "~/types/index.js";

export interface IHeadlessCmsEnhancerConfig {
    type: ApiEndpoint;
    extraPlugins?: any[];
}

export const HeadlessCmsEnhancerConfig = new Abstraction<IHeadlessCmsEnhancerConfig>(
    "HeadlessCmsEnhancerConfig"
);

/**
 * Per-request, post-auth setup that isn't expressible as a synchronous DI factory.
 *
 * Storage operations now build synchronously in HeadlessCmsFeature.register() (for every event),
 * and the HeadlessCms facade / AccessControl / export / import are lazy DI factories. What remains
 * here is legacy bridging that still depends on the shared request `ctx`:
 *
 * 1. Seeding `ctx.plugins` for the other (still ordered) RequestContextInitializers / contextual
 *    schemas that read it off `ctx` (e.g. hcms-tasks registers its schema plugins into ctx.plugins).
 * 2. Applying any ContextPlugin instances supplied via `extraPlugins` (test infra; their `apply()`
 *    is async).
 *
 * Both are slated for removal once those consumers move to DI (Phase 3).
 */
export class HeadlessCmsInitializerImpl implements IRequestContextInitializer {
    private initialized = false;

    constructor(private container: Container) {}

    async init(ctx: Record<string, any>): Promise<void> {
        const cmsContext = this.container.resolve(CmsContextAbstraction) as CmsContext;

        // Share the plugins container with downstream initializers / contextual schemas that still
        // read it off the request context object (e.g. hcms-tasks registers its schema plugins into
        // ctx.plugins). Benchmark is resolved from the container (BenchmarkAbstraction), not the bag.
        ctx.plugins = cmsContext.plugins;

        if (this.initialized) {
            return;
        }
        this.initialized = true;

        // Apply ContextPlugin instances from extraPlugins (they may register event handlers etc.)
        const config = this.container.resolve(HeadlessCmsEnhancerConfig);
        for (const plugin of config.extraPlugins ?? []) {
            if (plugin && typeof plugin.apply === "function") {
                await plugin.apply(ctx);
            }
        }
    }
}
