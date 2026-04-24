import { createFeature } from "@webiny/feature/api";
import { DisallowUnpublishableModelsOnBeforeCreate } from "./handlers/DisallowUnpublishableModelsOnBeforeCreate.js";

export const WorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        container.register(DisallowUnpublishableModelsOnBeforeCreate);
    }
});
