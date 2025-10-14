import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { attachCmsLifecycleEvents } from "~/cms/index.js";
import { attachStateLifecycleEvents } from "~/state/index.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        } else if (!context.workflows) {
            return;
        }

        attachCmsLifecycleEvents({ context });
        attachStateLifecycleEvents({ context });
    });

    plugin.name = "headless-cms-workflows.context";

    return plugin;
};
