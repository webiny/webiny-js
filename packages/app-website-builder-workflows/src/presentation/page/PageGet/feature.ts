import { createFeature } from "@webiny/feature/admin";
import { WorkflowStateGetPageFieldSelection } from "./WorkflowStatesGetPageGraphQLFieldSelection.js";

export const PageGetWorkflowsFeature = createFeature({
    name: "PageGetWorkflows",
    register(container) {
        container.register(WorkflowStateGetPageFieldSelection);
    }
});
