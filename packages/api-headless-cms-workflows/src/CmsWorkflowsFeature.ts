import { type Container, createFeature } from "@webiny/feature/api";
import { EntryWorkflowsFeature } from "./features/EntryWorkflows/feature.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container: Container) {
        // WCP guard is enforced inside WorkflowsContextEnhancer — register unconditionally.
        EntryWorkflowsFeature.register(container);
        CmsLocalWorkflowsFeature.register(container);
        WorkflowsFeature.register(container);
    }
});
