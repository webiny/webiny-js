import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { attachLifecycleEvents } from "~/lifecycleEvents/index.js";

export const createHeadlessCmsWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        }

        attachLifecycleEvents({ context });
    });

    plugin.name = "headless-cms-workflows.context";

    return plugin;
};
