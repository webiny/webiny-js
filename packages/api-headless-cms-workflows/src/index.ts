import { createContextPlugin } from "@webiny/api";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { WorkflowsFeature } from "~/features/Workflows/index.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = createContextPlugin(async context => {
        const wcpContext = context.container.resolve(WcpContext);

        if (!wcpContext.canUseWorkflows()) {
            return;
        }

        // Register features
        EntryWorkflowsFeature.register(context.container);
        WorkflowsFeature.register(context.container);
    });

    plugin.name = "headless-cms-workflows.context";

    return plugin;
};
export { CmsWorkflowsFeature } from "./CmsWorkflowsFeature.js";
