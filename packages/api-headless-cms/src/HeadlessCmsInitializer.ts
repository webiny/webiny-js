import { Abstraction } from "@webiny/di";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import type { ApiEndpoint } from "~/types/index.js";

export interface IHeadlessCmsEnhancerConfig {
    type: ApiEndpoint;
}

export const HeadlessCmsEnhancerConfig = new Abstraction<IHeadlessCmsEnhancerConfig>(
    "HeadlessCmsEnhancerConfig"
);

/**
 * No-op request initializer. Everything it used to do has moved:
 * - storage operations build synchronously in HeadlessCmsFeature.register() (for every event);
 * - the HeadlessCms facade / AccessControl / export / import are lazy DI factories;
 * - the `ctx.plugins` seeding was removed in Phase 3a (readers get the container from the writer);
 * - applying extraPlugins ContextPlugins moved to HeadlessCmsFeature.register() via
 *   registerLegacyPluginsViaGqlContextualSchema in Phase 3b.
 *
 * The class (and its registration) is removed entirely in Phase 3c.
 */
export class HeadlessCmsInitializerImpl implements IRequestContextInitializer {
    async init(): Promise<void> {
        // intentionally empty
    }
}
