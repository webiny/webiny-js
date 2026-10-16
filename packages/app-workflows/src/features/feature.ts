import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowsFeature } from "./listWorkflows/feature.js";
import { StoreWorkflowFeature } from "./storeWorkflow/feature.js";
import { DeleteWorkflowFeature } from "./deleteWorkflow/feature.js";
import { ListNotificationTypesFeature } from "./listNotificationTypes/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container) {
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        ListNotificationTypesFeature.register(container);
    }
});
