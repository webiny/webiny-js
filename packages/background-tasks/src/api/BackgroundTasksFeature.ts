import { createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";
import type { Plugin } from "@webiny/plugins";
import { createBackgroundTaskContext } from "./context.js";
import { createBackgroundTaskGraphQL } from "./graphql/index.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container: Container) {
        let initialized = false;

        const contextPlugins: Plugin[] = [
            ...createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL()
        ];

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                for (const plugin of contextPlugins) {
                    if (typeof (plugin as any).apply === "function") {
                        await (plugin as any).apply(ctx);
                    } else if (ctx.plugins) {
                        ctx.plugins.register(plugin);
                    }
                }
            }
        };

        container.registerInstance(GraphQLContextEnhancer, enhancer);
    }
});
