import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Plugin } from "@webiny/plugins";
import { createWebsocketsContext } from "~/context/index.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container: Container) {
        let initialized = false;

        const contextPlugins: Plugin[] = [createWebsocketsContext(), createWebsocketsGraphQL()];

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
