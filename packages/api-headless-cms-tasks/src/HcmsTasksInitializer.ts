import { RequestContextInitializer } from "@webiny/event-handler-core";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { createHcmsTasks } from "./index.js";

// A request initializer: it contributes no schema content, it just runs the legacy
// createHcmsTasks() plugins per request. It runs after context enhancers and after the CMS
// initializer (which registers the CMS facade and ctx.plugins these plugins rely on), and before
// contextual schemas.
class HcmsTasksInitializerImpl implements IRequestContextInitializer {
    private readonly plugins = createHcmsTasks().flat(Infinity as 1);
    private initialized = false;

    async init(ctx: Record<string, any>): Promise<void> {
        if (!this.initialized) {
            this.initialized = true;

            // Every createHcmsTasks() plugin is a ContextPlugin whose apply() does DI registration
            // (CmsGraphQLSchemaFactory / Feature.register). The old `else ctx.plugins.register(...)`
            // fallback was dead — nothing produced non-apply plugins here.
            for (const plugin of this.plugins) {
                if (plugin && typeof (plugin as any).apply === "function") {
                    await (plugin as any).apply(ctx);
                }
            }
        }
    }
}

export const HcmsTasksInitializer = RequestContextInitializer.createImplementation({
    implementation: HcmsTasksInitializerImpl,
    dependencies: []
});
