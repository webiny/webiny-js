import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowsFeature } from "./listWorkflows/feature.js";
import { StoreWorkflowFeature } from "./storeWorkflow/feature.js";
import { DeleteWorkflowFeature } from "./deleteWorkflow/feature.js";
import { GetTargetWorkflowStateFeature } from "./getTargetWorkflowState/feature.js";
import { RequestReviewFeature } from "./requestReview/feature.js";
import { StartStepFeature } from "./startStep/feature.js";
import { ApproveStepFeature } from "./approveStep/feature.js";
import { RejectStepFeature } from "./rejectStep/feature.js";
import { TakeOverStepFeature } from "./takeOverStep/feature.js";
import { CancelWorkflowStateFeature } from "./cancelWorkflowState/feature.js";
import { ListWorkflowStatesFeature } from "./listWorkflowStates/feature.js";
import { ListNotificationTypesFeature } from "./listNotificationTypes/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container) {
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        GetTargetWorkflowStateFeature.register(container);
        RequestReviewFeature.register(container);
        StartStepFeature.register(container);
        ApproveStepFeature.register(container);
        RejectStepFeature.register(container);
        TakeOverStepFeature.register(container);
        CancelWorkflowStateFeature.register(container);
        ListWorkflowStatesFeature.register(container);
        ListNotificationTypesFeature.register(container);
    }
});
