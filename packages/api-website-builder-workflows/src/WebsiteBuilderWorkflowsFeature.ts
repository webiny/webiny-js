import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPlugins } from "@webiny/handler-graphql";
import { createContextPlugin } from "@webiny/api";
import { PageWorkflowsFeature } from "./features/PageWorkflows/feature.js";
import { createWebsiteBuilderPageGraphQLExtension } from "./graphql/page.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        const contextPlugin = createContextPlugin(async context => {
            const wcpContext = context.container.resolve(WcpContext);

            if (!wcpContext.canUseWorkflows()) {
                return;
            }

            PageWorkflowsFeature.register(context.container);
        });
        contextPlugin.name = "website-builder-workflows.context";

        registerLegacyPlugins(container, [
            contextPlugin,
            createWebsiteBuilderPageGraphQLExtension()
        ]);
    }
});
