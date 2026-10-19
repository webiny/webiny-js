import { createFeature } from "@webiny/feature/admin";
import { CmsEntryFormPresenterReviewDecorator } from "./CmsEntryFormPresenterReviewDecorator.js";
import { CmsReviewGetEntryFieldSelection } from "./CmsReviewGetEntryFieldSelection.js";
import { CmsReviewListEntriesFieldSelection } from "./CmsReviewListEntriesFieldSelection.js";
import { CmsReviewTableRowMapperDecorator } from "./CmsReviewTableRowMapperDecorator.js";
import { CmsRevisionsListPresenterDecorator } from "./CmsRevisionsListPresenterDecorator.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // The review services are registered by WorkflowsAdminApp.
        container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
        container.registerDecorator(CmsReviewTableRowMapperDecorator);
        container.registerDecorator(CmsRevisionsListPresenterDecorator);
        container.register(CmsReviewListEntriesFieldSelection);
        container.register(CmsReviewGetEntryFieldSelection);
    }
});
