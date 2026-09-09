import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsSchemaFactory } from "./WorkflowsSchemaFactory.js";
import { WorkflowModel as WorkflowPrivateModel } from "./domain/workflow/workflowModel.js";
import { WorkflowStateModel as WorkflowStatePrivateModel } from "./domain/workflowState/stateModel.js";
import {
    WorkflowModelProviderImpl,
    WorkflowStateModelProviderImpl
} from "~/features/WorkflowModelProviders.js";
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
import { GetUserTeamsFeature } from "~/features/internal/GetUserTeams/feature.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "./features/notifications/NotificationTransport/index.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Register private CMS model definitions early so HeadlessCmsInitializerImpl
        // picks them up when it builds the model list during the enhance phase.
        container.register(WorkflowPrivateModel);
        container.register(WorkflowStatePrivateModel);
        container.register(WorkflowsSchemaFactory);

        // The per-tenant models are resolved on demand — see WorkflowModelProviders.
        container.register(WorkflowModelProviderImpl);
        container.register(WorkflowStateModelProviderImpl);

        container.register(WorkflowMapper);
        container.register(WorkflowStateMapper);

        // Notifications
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        CreateWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        UpdateWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);

        // Internal
        GetUserTeamsFeature.register(container);

        // Workflow state
        GetWorkflowStateFeature.register(container);
        GetTargetWorkflowStateFeature.register(container);
        ListOwnWorkflowStatesFeature.register(container);
        ListWorkflowStatesFeature.register(container);
        ListRequestedWorkflowStatesFeature.register(container);
        CreateWorkflowStateFeature.register(container);
        UpdateWorkflowStateFeature.register(container);
        CancelWorkflowStateFeature.register(container);
        DeleteWorkflowStateFeature.register(container);
        DeleteTargetWorkflowStateFeature.register(container);
        StartWorkflowStateStepFeature.register(container);
        ApproveWorkflowStateStepFeature.register(container);
        RejectWorkflowStateStepFeature.register(container);
        TakeOverWorkflowStateStepFeature.register(container);
    }
});
