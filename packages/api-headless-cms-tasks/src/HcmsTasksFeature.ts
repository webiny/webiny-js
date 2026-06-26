import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextInitializer } from "@webiny/handler-graphql";
import type { IGraphQLContextInitializer } from "@webiny/handler-graphql";
import { createHcmsTasks } from "./index.js";

// A request initializer: it contributes no schema content, it just runs the legacy
// createHcmsTasks() plugins per request. It runs after context enhancers and after the CMS
// initializer (which registers the CMS facade and ctx.plugins these plugins rely on), and before
// contextual schemas.
class HcmsTasksInitializerImpl implements IGraphQLContextInitializer {
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

const HcmsTasksInitializer = GraphQLContextInitializer.createImplementation({
    implementation: HcmsTasksInitializerImpl,
    dependencies: []
});

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container: Container) {
        container.register(HcmsTasksInitializer);
    }
});
