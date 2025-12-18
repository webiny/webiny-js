import { createContextPlugin } from "@webiny/api";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = createContextPlugin(async context => {
        const wcpContext = context.container.resolve(WcpContext);

        if (!wcpContext.canUseWorkflows()) {
            return;
        }

        // Register features
        EntryWorkflowsFeature.register(context.container, context);
    });

    plugin.name = "headless-cms-workflows.context";

    return plugin;
};
