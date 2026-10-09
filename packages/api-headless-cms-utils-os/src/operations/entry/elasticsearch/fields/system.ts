import type { ModelFieldParent, ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createSystemField } from "./createSystemField.js";
import { createModelField } from "@webiny/api-headless-cms";

const WORKFLOW_TEXT_FIELDS = ["workflowId", "reviewState", "stepId", "stepState"];

const systemParent: ModelFieldParent = {
    fieldId: "system",
    type: "object",
    storageId: "system"
};

const workflowParent: ModelFieldParent = {
    fieldId: "workflow",
    type: "object",
    storageId: "workflow"
};

const createWorkflowTextField = (fieldId: string): CmsModelField => {
    return createModelField({
        id: fieldId,
        fieldId,
        storageId: fieldId,
        type: "text",
        label: fieldId
    });
};

const createWorkflowField = (): CmsModelField => {
    return createModelField({
        id: "workflow",
        fieldId: "workflow",
        storageId: "workflow",
        type: "object",
        label: "Workflow",
        settings: {
            fields: WORKFLOW_TEXT_FIELDS.map(createWorkflowTextField)
        }
    });
};

const workflowField = createWorkflowField();

const workflowTextFields = WORKFLOW_TEXT_FIELDS.reduce<ModelFields>((result, fieldId) => {
    result[`system.workflow.${fieldId}`] = {
        type: "text",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [systemParent, workflowParent],
        field: createSystemField({
            fieldId,
            storageId: fieldId,
            type: "text",
            label: fieldId
        })
    };
    return result;
}, {});

/**
 * The `system` object is indexed as-is (raw storage ids), so the filter paths
 * resolve to `system.workflow.<fieldId>.keyword` for the text fields.
 */
export const systemFields: ModelFields = {
    system: {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: false,
        field: createSystemField({
            storageId: "system",
            fieldId: "system",
            type: "object",
            settings: {
                fields: [workflowField]
            }
        }),
        parents: []
    },
    /**
     * ObjectFilter resolves one level at a time, so the intermediate object needs its own entry.
     */
    "system.workflow": {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: false,
        parents: [systemParent],
        field: workflowField
    },
    ...workflowTextFields
};
