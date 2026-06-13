import { createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";
import { createWebsiteBuilder } from "./index.js";
import { WebsiteBuilderRedirectsRoute } from "./rest/WebsiteBuilderRedirectsRoute.js";
import { GetActiveRedirectsFeature } from "./features/redirects/GetActiveRedirects/feature.js";

export const WebsiteBuilderFeature = createFeature({
    name: "WebsiteBuilder",
    register(container: Container) {
        GetActiveRedirectsFeature.register(container);
        container.register(WebsiteBuilderRedirectsRoute);

        const plugins = createWebsiteBuilder().flat(Infinity as 1);
        let initialized = false;

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                for (const plugin of plugins) {
                    if (plugin && typeof (plugin as any).apply === "function") {
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
