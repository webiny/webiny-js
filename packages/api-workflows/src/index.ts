import { createSchema } from "~/graphql/schema.js";
import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/model.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";

export const createWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        // if (!context.wcp.canUseWorkflows()) {
        //     return;
        // }

        context.plugins.register(createWorkflowModel());
        await createContext(context);
        context.plugins.register(createSchema());
    });

    plugin.name = "workflows.context";

    return plugin;
};
