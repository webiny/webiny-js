import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel as WorkflowPrivateModel } from "./domain/workflow/workflowModel.js";
import { WorkflowModelProviderImpl } from "~/features/WorkflowModelProviders.js";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { CreateWorkflowFeature } from "~/features/workflow/CreateWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { UpdateWorkflowFeature } from "~/features/workflow/UpdateWorkflow/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
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
        container.register(WorkflowModelProviderImpl);
        container.register(WorkflowMapper);

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
    }
});
