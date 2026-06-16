import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Plugin } from "@webiny/plugins";
import { createContextPlugin } from "@webiny/api";
import { PageWorkflowsFeature } from "./features/PageWorkflows/feature.js";
import { createWebsiteBuilderPageGraphQLExtension } from "./graphql/page.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        let initialized = false;

        const contextPlugin = createContextPlugin(async context => {
            const wcpContext = context.container.resolve(WcpContext);

            if (!wcpContext.canUseWorkflows()) {
                return;
            }

            PageWorkflowsFeature.register(context.container);
        });
        contextPlugin.name = "website-builder-workflows.context";

        const contextPlugins: Plugin[] = [
            contextPlugin as unknown as Plugin,
            createWebsiteBuilderPageGraphQLExtension() as unknown as Plugin
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
