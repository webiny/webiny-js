import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/models/workflowModel.js";
import { createStateModel } from "~/context/models/stateModel.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { createWorkflowsSchema } from "~/graphql/workflows.js";

export const createWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.wcp.canUseWorkflows()) {
            return;
        }

        context.plugins.register(createWorkflowModel(), createStateModel());
        await createContext(context);
        context.plugins.register(createWorkflowsSchema());
    });

    plugin.name = "workflows.context";

    return plugin;
};
