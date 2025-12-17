import { createContext } from "~/context/index.js";
import { createWorkflowModel, WORKFLOW_MODEL_ID } from "./domain/workflow/workflowModel.js";
import {
    createWorkflowStateModel,
    WORKFLOW_STATE_MODEL_ID
} from "./domain/workflowState/stateModel.js";
import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { createWorkflowsSchema } from "~/graphql/workflows.js";
import { createWorkflowStateSchema } from "~/graphql/workflowState.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { WorkflowModel } from "./domain/workflow/abstractions.js";
import { WorkflowStateModel } from "./domain/workflowState/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import { WorkflowStateMapper } from "~/domain/workflowState/WorkflowStateMapper.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";

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

        // Register CMS model plugins
        const workflowModelDefinition = createWorkflowModel();
        const workflowStateModelDefinition = createWorkflowStateModel();
        context.plugins.register(workflowModelDefinition, workflowStateModelDefinition);

        // Fetch and register CMS models
        const getModel = context.container.resolve(GetModelUseCase);

        await context.security.withoutAuthorization(async () => {
            const [workflowModel, workflowStateModel] = await Promise.all([
                getModel.execute(WORKFLOW_MODEL_ID),
                getModel.execute(WORKFLOW_STATE_MODEL_ID)
            ]);

            context.container.registerInstance(WorkflowModel, workflowModel.value);
            context.container.registerInstance(WorkflowStateModel, workflowStateModel.value);
        });

        // Register mappers
        context.container.register(WorkflowMapper);
        context.container.register(WorkflowStateMapper);

        // Register workflow features
        GetWorkflowFeature.register(context.container);

        await createContext(context);
        context.plugins.register(createWorkflowsSchema(), createWorkflowStateSchema());
    });

    plugin.name = "workflows.context";

    return plugin;
};
