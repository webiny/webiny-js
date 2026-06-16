import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import { createHcmsTasks } from "./index.js";

// Must be a class registration (container.register) rather than an instance registration
// (container.registerInstance), because the DI container resolves instance registrations
// before class registrations. HeadlessCmsContextEnhancer is a class registration and must
// run first to set ctx.cms before this enhancer applies ContextPlugin instances that
// call context.cms.listModels().
class HcmsTasksContextEnhancerImpl implements IGraphQLContextEnhancer {
    private readonly plugins = createHcmsTasks().flat(Infinity as 1);
    private initialized = false;

    async enhance(ctx: Record<string, any>): Promise<void> {
        if (this.initialized) {
            return;
        }
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

const HcmsTasksContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: HcmsTasksContextEnhancerImpl,
    dependencies: []
});

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container: Container) {
        container.register(HcmsTasksContextEnhancer);
    }
});
