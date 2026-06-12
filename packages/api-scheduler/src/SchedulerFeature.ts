import { createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";
import type { Plugin } from "@webiny/plugins";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerContext } from "./context.js";

export interface ISchedulerFeatureConfig {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container, config: ISchedulerFeatureConfig) {
        let initialized = false;

        const contextPlugins: Plugin[] = [
            ...createSchedulerContext({ getClient: config.getClient })
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
