import type { Container } from "@webiny/di";
import { Abstraction } from "@webiny/di";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import type { ApiEndpoint } from "~/types/index.js";

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
 * and the HeadlessCms facade / AccessControl / export / import are lazy DI factories. The
 * `ctx.plugins` seeding has been removed (Phase 3a): every reader of the request plugins container
 * (background-tasks createService, file-manager-s3 createFileNormalizer) gets it from the writer
 * that registers those plugins — registerLegacyPluginsViaGqlContextualSchema, which lazily creates
 * `ctx.plugins` — so the CMS no longer needs to pre-seed it.
 *
 * What remains here is applying any ContextPlugin instances supplied via `extraPlugins` (test infra;
 * their `apply()` is async) — slated for removal in Phase 3b.
 */
export class HeadlessCmsInitializerImpl implements IRequestContextInitializer {
    private initialized = false;

    constructor(private container: Container) {}

    async init(ctx: Record<string, any>): Promise<void> {
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
