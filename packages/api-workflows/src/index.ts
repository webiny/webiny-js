import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/models/workflowModel.js";
import { createStateModel } from "~/context/models/stateModel.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { createWorkflowsSchema } from "~/graphql/workflows.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";

export type {
    IWorkflowState,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep
} from "./context/abstractions/WorkflowState.js";
export type {
    IWorkflow,
    IWorkflowStepNotification,
    IWorkflowStepTeam
} from "./context/abstractions/Workflow.js";

export const createWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }
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
