import { createFeature } from "@webiny/feature/admin";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";
import { TableRowMapperWorkflowDecorator } from "./TableRowMapperWorkflowDecorator.js";
import { WorkflowStateListEntriesFieldSelection } from "./WorkflowStateListEntriesFieldSelection.js";
import { WorkflowStateGetEntryFieldSelection } from "./WorkflowStateGetEntryFieldSelection.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // WorkflowsFeature and WorkflowStatePresenterFeature are registered by WorkflowsAdminApp.
        container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);
        container.registerDecorator(TableRowMapperWorkflowDecorator);
        container.register(WorkflowStateListEntriesFieldSelection);
        container.register(WorkflowStateGetEntryFieldSelection);
    }
});
