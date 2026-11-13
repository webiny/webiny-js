import { createFeature } from "@webiny/feature/api";
import { DisallowUnpublishableModelsOnBeforeCreate } from "./handlers/DisallowUnpublishableModelsOnBeforeCreate.js";
import { CmsWorkflowAppAccess } from "./decorators/CmsWorkflowAppAccess.js";

export const WorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        container.register(DisallowUnpublishableModelsOnBeforeCreate);
        container.registerDecorator(CmsWorkflowAppAccess);
    }
});
