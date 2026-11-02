import { createModelField } from "@webiny/api-headless-cms";
import { CmsEntrySystemField } from "@webiny/api-headless-cms/features/contentEntry/EntrySystemField/index.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

const WORKFLOW_TEXT_FIELDS = ["workflowId", "reviewState", "stepId", "stepState"];

/**
 * Makes `system.workflow` filterable in CMS entry listing (spec 4.5), on every storage. Website
 * Builder pages are CMS entries, so this covers them too.
 */
class WorkflowEntrySystemFieldImpl implements CmsEntrySystemField.Interface {
    public readonly field: CmsModelField = createModelField({
        id: "workflow",
        fieldId: "workflow",
        storageId: "workflow",
        type: "object",
        label: "Workflow",
        settings: {
            fields: WORKFLOW_TEXT_FIELDS.map(fieldId => {
                return createModelField({
                    id: fieldId,
                    fieldId,
                    storageId: fieldId,
                    type: "text",
                    label: fieldId
                });
            })
        }
    });
}

export const WorkflowEntrySystemField = CmsEntrySystemField.createImplementation({
    implementation: WorkflowEntrySystemFieldImpl,
    dependencies: []
});
