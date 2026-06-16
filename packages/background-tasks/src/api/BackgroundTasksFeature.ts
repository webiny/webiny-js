import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Plugin } from "@webiny/plugins";
import { createBackgroundTaskContext } from "./context.js";
import { createBackgroundTaskGraphQL } from "./graphql/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container: Container) {
        // Register models at register() time so they are available to GetModelUseCase when the
        // ModelsFetcher cache is first filled (which may happen during an earlier feature's enhance).
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);

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
