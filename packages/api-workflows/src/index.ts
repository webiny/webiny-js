import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/models/workflowModel.js";
import { createWorkflowStateModel } from "~/context/models/stateModel.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { createWorkflowsSchema } from "~/graphql/workflows.js";
import { createWorkflowStateSchema } from "~/graphql/workflowState.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";

export * from "./context/errors/index.js";

export type {
    IWorkflowState,
    IWorkflowStateRecord,
    IWorkflowStateRecordStep,
    IWorkflowStateModel
} from "./context/abstractions/WorkflowState.js";
export type {
    IWorkflow,
    IWorkflowStepNotification,
    IWorkflowStepTeam,
    IWorkflowStep
} from "./context/abstractions/Workflow.js";

export const createWorkflows = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        if (!tenantContext.getTenant()) {
            return;
        }

        if (!context.wcp.canUseWorkflows()) {
            return;
        }

        context.plugins.register(createWorkflowModel(), createWorkflowStateModel());
        await createContext(context);
        context.plugins.register(createWorkflowsSchema(), createWorkflowStateSchema());
    });

    plugin.name = "workflows.context";

    return plugin;
};
