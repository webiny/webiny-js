import { ContextPlugin } from "@webiny/handler/Context.js";
import { attachLifecycleEvents } from "~/websiteBuilder/index.js";
import { Context } from "./types.js";
import { attachStateLifecycleEvents } from "~/state/index.js";
import { createWebsiteBuilderPageGraphQLExtension } from "~/graphql/page.js";

export const createWebsiteBuilderWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        } else if (!context.workflows) {
            return;
        }

        attachLifecycleEvents({
            context
        });
        attachStateLifecycleEvents({
            context
        });
    });

    plugin.name = "website-builder-workflows.context";

    return [plugin, createWebsiteBuilderPageGraphQLExtension()];
};
