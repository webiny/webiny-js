import { createModelField } from "../utils";

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "workflow",
        validation: [
            {
                message: "Value is required.",
                name: "required"
            }
        ]
    });

const stepsField = fields =>
    createModelField({
        label: "Steps",
        type: "object",
        parent: "workflow",
        settings: {
            fields
        },
        multipleValues: true
    });

const stepTitleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "workflow steps",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const stepTypeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "workflow steps",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    value: "mandatory_blocking",
                    label: "Mandatory, blocking  - An approval from a reviewer is required before being able to move to the next step and publish the content. "
                },
                {
                    value: "mandatory_non_blocking",
                    label: "Mandatory, non-blocking - An approval from a reviewer is to publish the content, but the next step in the review workflow is not blocked. "
                },
                {
                    value: "not_mandatory",
                    label: "Not mandatory - This is an optional review step. The content can be published regardless if an approval is provided or not."
                }
            ]
        },
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const stepSlugField = () =>
    createModelField({
        label: "Slug",
        type: "text",
        parent: "workflow steps",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const stepReviewersField = reviewerModelId =>
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

const scopeField = fields =>
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
                name: "required",
                message: "Value is required."
            }
        ],
        predefinedValues: {
            enabled: true,
            values: [
                {
                    value: "default",
                    label: "Default  - Catch all scope that applies to all content that's being published."
                },
                {
                    value: "pb",
                    label: "Page category (Page Builder only) - The workflow will apply to all pages inside specific categories."
                },
                {
                    value: "cms",
                    label: "Content model (Headless CMS only) - The workflow will apply to all the content inside the specific content models. "
                }
            ]
        }
    });

const scopeDataField = fields =>
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
        label: "Category",
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
                name: "required",
                message: "Value is required."
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

export const createWorkflowModelDefinition = ({ reviewerModelId }) => ({
    name: "APW - Workflow",
    /**
     * Id of the model cannot be appWorkflow because it clashes with the GraphQL types for APW.
     */
    modelId: "apwWorkflowModelDefinition",
    layout: [["workflow_title"], ["workflow_steps"], ["workflow_scope"], ["workflow_app"]],
    titleFieldId: "title",
    description: null,
    fields: [
        titleField(),
        stepsField([
            stepTitleField(),
            stepTypeField(),
            stepSlugField(),
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
    ]
});
