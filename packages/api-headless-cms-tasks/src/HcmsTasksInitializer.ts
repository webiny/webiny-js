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

            for (const plugin of this.plugins) {
                if (plugin && typeof (plugin as any).apply === "function") {
                    await (plugin as any).apply(ctx);
                } else if (ctx.plugins) {
                    ctx.plugins.register(plugin);
                }
            }
        }
    }
}

export const HcmsTasksInitializer = RequestContextInitializer.createImplementation({
    implementation: HcmsTasksInitializerImpl,
    dependencies: []
});
