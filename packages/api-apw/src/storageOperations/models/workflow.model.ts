import { createModelField } from "./utils";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { WorkflowModelDefinition, WorkflowScopeTypes } from "~/types";

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "workflow",
        validation: [
            {
                message: "`title` field value is required in workflow.",
                name: "required"
            }
        ]
    });

const stepsField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Steps",
        type: "object",
        parent: "workflow",
        settings: {
            fields
        },
        multipleValues: true
    });

export const stepTitleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "workflow steps",
        validation: [
            {
                message: "`title` field value is required in workflow steps.",
                name: "required"
            }
        ]
    });

export const stepTypeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "workflow steps",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    value: "mandatoryBlocking",
                    label: "Mandatory, blocking  - An approval from a reviewer is required before being able to move to the next step and publish the content. "
                },
                {
                    value: "mandatoryNonBlocking",
                    label: "Mandatory, non-blocking - An approval from a reviewer is to publish the content, but the next step in the review workflow is not blocked. "
                },
                {
                    value: "notMandatory",
                    label: "Not mandatory - This is an optional review step. The content can be published regardless if an approval is provided or not."
                }
            ]
        },
        validation: [
            {
                name: "required",
                message: "`type` field value is required in workflow steps."
            }
        ]
    });

export const stepIdField = () =>
    createModelField({
        label: "Id",
        type: "text",
        parent: "workflow steps",
        validation: [
            {
                message: "`id` field value is required in workflow steps.",
                name: "required"
            }
        ]
    });

export const stepReviewersField = (reviewerModelId: string) =>
    createModelField({
        label: "Reviewers",
        type: "ref",
        parent: "workflow steps",
        multipleValues: true,
        settings: {
            models: [
                {
                    modelId: reviewerModelId
                }
            ]
        },
        listValidation: [
            {
                name: "minLength",
                message: "Value is too short.",
                settings: {
                    value: "1"
                }
            }
        ]
    });

const scopeField = (fields: CmsModelField[]) =>
    createModelField({
        type: "object",
        label: "Scope",
        parent: "workflow",
        settings: {
            fields
        }
    });

const scopeTypeField = () =>
    createModelField({
        label: "Type",
        parent: "workflow scope",
        type: "text",
        validation: [
            {
                message: "`type` field value is required in workflow scope.",
                name: "required"
            }
        ],
        predefinedValues: {
            enabled: true,
            values: [
                {
                    value: WorkflowScopeTypes.DEFAULT,
                    label: "Default  - Catch all scope that applies to all content that's being published."
                },
                {
                    value: WorkflowScopeTypes.CUSTOM,
                    label: "Custom - The workflow will be applied to all selected content."
                }
            ]
        }
    });

const scopeDataField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Data",
        parent: "workflow scope",
        type: "object",
        settings: {
            fields
        }
    });

const scopeDataPbCategories = () =>
    createModelField({
        label: "Categories",
        parent: "workflow scope data",
        type: "text",
        multipleValues: true
    });
const scopeDataPbPages = () =>
    createModelField({
        label: "Pages",
        parent: "workflow scope data",
        type: "text",
        multipleValues: true
    });
const scopeDataCmsModels = () =>
    createModelField({
        label: "Models",
        parent: "workflow scope data",
        type: "text",
        multipleValues: true
    });
const scopeDataCmsEntries = () =>
    createModelField({
        label: "Entries",
        parent: "workflow scope data",
        type: "text",
        multipleValues: true
    });

const applicationField = () =>
    createModelField({
        parent: "workflow",
        type: "text",
        label: "App",
        validation: [
            {
                message: "`app` field value is required in workflow.",
                name: "required"
            }
        ],
        predefinedValues: {
            enabled: true,
            values: [
                { label: "Page Builder", value: "pageBuilder" },
                { label: "Headless CMS", value: "cms" }
            ]
        }
    });

interface CreateWorkflowModelDefinitionParams {
    reviewerModelId: string;
}

export const WORKFLOW_MODEL_ID = "apwWorkflowModelDefinition";

export const createWorkflowModelDefinition = ({
    reviewerModelId
}: CreateWorkflowModelDefinitionParams): WorkflowModelDefinition => ({
    name: "APW - Workflow",
    /**
     * Id of the model cannot be appWorkflow because it clashes with the GraphQL types for APW.
     */
    modelId: WORKFLOW_MODEL_ID,
    layout: [["workflow_title"], ["workflow_steps"], ["workflow_scope"], ["workflow_app"]],
    titleFieldId: "title",
    description: "",
    fields: [
        titleField(),
        stepsField([
            stepTitleField(),
            stepTypeField(),
            stepIdField(),
            stepReviewersField(reviewerModelId)
        ]),
        scopeField([
            scopeTypeField(),
            scopeDataField([
                scopeDataPbCategories(),
                scopeDataPbPages(),
                scopeDataCmsModels(),
                scopeDataCmsEntries()
            ])
        ]),
        applicationField()
    ],
    isPrivate: true
});
