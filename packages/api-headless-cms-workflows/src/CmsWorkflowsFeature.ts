import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createContextPlugin } from "@webiny/api";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { WorkflowsFeature } from "./features/Workflows/index.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container: Container) {
        const contextPlugin = createContextPlugin(async context => {
            const wcpContext = context.container.resolve(WcpContext);

            if (!wcpContext.canUseWorkflows()) {
                return;
            }

            EntryWorkflowsFeature.register(context.container);
            WorkflowsFeature.register(context.container);
        });
        contextPlugin.name = "headless-cms-workflows.context";

        registerLegacyPluginsViaGqlContextEnhancer(container, [contextPlugin]);
    }
});
