import { createFeature } from "@webiny/feature/admin";
import { WorkflowsFeature } from "@webiny/app-workflows";
import { WorkflowStatePresenterFeature } from "@webiny/app-workflows/presentation/workflowState/feature.js";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        WorkflowsFeature.register(container);
        WorkflowStatePresenterFeature.register(container);
        container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);
    }
});
