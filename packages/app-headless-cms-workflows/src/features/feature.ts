import { createFeature } from "@webiny/feature/admin";
import { WorkflowStateCacheHandler } from "./WorkflowStateCacheHandler.js";

export const CmsWorkflowsCacheFeature = createFeature({
    name: "CmsWorkflows/Cache",
    register(container) {
        container.register(WorkflowStateCacheHandler);
    }
});
