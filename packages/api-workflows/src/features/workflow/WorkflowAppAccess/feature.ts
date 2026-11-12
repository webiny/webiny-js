import { createFeature } from "@webiny/feature/api";
import { DefaultWorkflowAppAccess } from "./DefaultWorkflowAppAccess.js";

export const WorkflowAppAccessFeature = createFeature({
    name: "Workflows/WorkflowAppAccess",
    register(container) {
        container.register(DefaultWorkflowAppAccess);
    }
});
