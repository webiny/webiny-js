import { createFeature } from "@webiny/feature/api";
import { DisallowUnpublishableModelsOnBeforeCreate } from "./handlers/DisallowUnpublishableModelsOnBeforeCreate.js";
import { DisallowUnpublishableModelsOnBeforeUpdate } from "./handlers/DisallowUnpublishableModelsOnBeforeUpdate.js";

export const WorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        container.register(DisallowUnpublishableModelsOnBeforeCreate);
        container.register(DisallowUnpublishableModelsOnBeforeUpdate);
    }
});
