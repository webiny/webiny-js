import { createFeature } from "@webiny/feature/admin";
import { CmsEntryFormPresenterReviewDecorator } from "./CmsEntryFormPresenterReviewDecorator.js";
import { TableRowMapperWorkflowDecorator } from "./TableRowMapperWorkflowDecorator.js";
import { WorkflowStateListEntriesFieldSelection } from "./WorkflowStateListEntriesFieldSelection.js";
import { WorkflowStateGetEntryFieldSelection } from "./WorkflowStateGetEntryFieldSelection.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // WorkflowsFeature and WorkflowStatePresenterFeature are registered by WorkflowsAdminApp.
        container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
        container.registerDecorator(TableRowMapperWorkflowDecorator);
        container.register(WorkflowStateListEntriesFieldSelection);
        container.register(WorkflowStateGetEntryFieldSelection);
    }
});
