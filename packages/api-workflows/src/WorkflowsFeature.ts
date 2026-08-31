import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsInitializer } from "./WorkflowsInitializer.js";
import { WorkflowsSchemaFactory } from "./WorkflowsSchemaFactory.js";
import { WorkflowModel as WorkflowPrivateModel } from "./domain/workflow/workflowModel.js";
import { WorkflowStateModel as WorkflowStatePrivateModel } from "./domain/workflowState/stateModel.js";

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
        container.register(WorkflowsInitializer);
        container.register(WorkflowsSchemaFactory);
    }
});
