import { WcpContext } from "@webiny/api-core/src/features/wcp/WcpContext/index.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
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
