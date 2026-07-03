import { createFeature } from "@webiny/feature/admin";
import { WorkflowsFeature } from "@webiny/app-workflows";
import { WorkflowStatePresenterFeature } from "@webiny/app-workflows/presentation/workflowState/feature.js";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";
import { TableRowMapperWorkflowDecorator } from "./TableRowMapperWorkflowDecorator.js";
import { WorkflowStateListEntriesFieldSelection } from "./WorkflowStateListEntriesFieldSelection.js";
import { WorkflowStateGetEntryFieldSelection } from "./WorkflowStateGetEntryFieldSelection.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        WorkflowsFeature.register(container);
        WorkflowStatePresenterFeature.register(container);
        container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);
        container.registerDecorator(TableRowMapperWorkflowDecorator);
        container.register(WorkflowStateListEntriesFieldSelection);
        container.register(WorkflowStateGetEntryFieldSelection);
    }
});
