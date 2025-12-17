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
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { CreateWorkflowFeature } from "~/features/workflow/CreateWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { UpdateWorkflowFeature } from "~/features/workflow/UpdateWorkflow/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { GetWorkflowStateFeature } from "~/features/workflowState/GetWorkflowState/feature.js";
import { GetTargetWorkflowStateFeature } from "~/features/workflowState/GetTargetWorkflowState/feature.js";
import { ListOwnWorkflowStatesFeature } from "~/features/workflowState/ListOwnWorkflowStates/feature.js";
import { ListWorkflowStatesFeature } from "~/features/workflowState/ListWorkflowStates/feature.js";
import { ListRequestedWorkflowStatesFeature } from "~/features/workflowState/ListRequestedWorkflowStates/feature.js";
import { CreateWorkflowStateFeature } from "~/features/workflowState/CreateWorkflowState/feature.js";
import { UpdateWorkflowStateFeature } from "~/features/workflowState/UpdateWorkflowState/feature.js";
import { CancelWorkflowStateFeature } from "~/features/workflowState/CancelWorkflowState/feature.js";
import { DeleteWorkflowStateFeature } from "~/features/workflowState/DeleteWorkflowState/feature.js";
import { DeleteTargetWorkflowStateFeature } from "~/features/workflowState/DeleteTargetWorkflowState/feature.js";
import { StartWorkflowStateStepFeature } from "~/features/workflowState/StartWorkflowStateStep/feature.js";
import { ApproveWorkflowStateStepFeature } from "~/features/workflowState/ApproveWorkflowStateStep/feature.js";
import { RejectWorkflowStateStepFeature } from "~/features/workflowState/RejectWorkflowStateStep/feature.js";
import { TakeOverWorkflowStateStepFeature } from "~/features/workflowState/TakeOverWorkflowStateStep/feature.js";

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
        ListWorkflowsFeature.register(context.container);
        CreateWorkflowFeature.register(context.container);
        DeleteWorkflowFeature.register(context.container);
        UpdateWorkflowFeature.register(context.container);
        StoreWorkflowFeature.register(context.container);

        // Register workflow state features
        GetWorkflowStateFeature.register(context.container);
        GetTargetWorkflowStateFeature.register(context.container);
        ListOwnWorkflowStatesFeature.register(context.container);
        ListWorkflowStatesFeature.register(context.container);
        ListRequestedWorkflowStatesFeature.register(context.container);
        CreateWorkflowStateFeature.register(context.container);
        UpdateWorkflowStateFeature.register(context.container);
        CancelWorkflowStateFeature.register(context.container);
        DeleteWorkflowStateFeature.register(context.container);
        DeleteTargetWorkflowStateFeature.register(context.container);
        StartWorkflowStateStepFeature.register(context.container);
        ApproveWorkflowStateStepFeature.register(context.container);
        RejectWorkflowStateStepFeature.register(context.container);
        TakeOverWorkflowStateStepFeature.register(context.container);

        await createContext(context);
        context.plugins.register(createWorkflowsSchema(), createWorkflowStateSchema());
    });

    plugin.name = "workflows.context";

    return plugin;
};
