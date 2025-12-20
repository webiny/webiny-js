import { createContextPlugin } from "@webiny/api";
import { PageWorkflowsFeature } from "./features/PageWorkflows/feature.js";
import { createWebsiteBuilderPageGraphQLExtension } from "~/graphql/page.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const createWebsiteBuilderWorkflows = () => {
    const plugin = createContextPlugin(async context => {
        const wcpContext = context.container.resolve(WcpContext);

        if (!wcpContext.canUseWorkflows()) {
            return;
        }

        // Register features
        PageWorkflowsFeature.register(context.container, context);
    });

    plugin.name = "website-builder-workflows.context";

    return [plugin, createWebsiteBuilderPageGraphQLExtension()];
};
