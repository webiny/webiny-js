import { createModelField } from "./utils";
import { stepTitleField, stepTypeField, stepIdField, stepReviewersField } from "./workflow.model";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { WorkflowModelDefinition } from "~/types";

const contentField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Content",
        parent: "contentReview",
        type: "object",
        multipleValues: false,
        settings: { fields },
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const contentStatus = () =>
    createModelField({
        label: "Status",
        parent: "contentReview",
        type: "text",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    label: "Under review",
                    value: "underReview"
                },
                {
                    label: "Ready to be published",
                    value: "readyToBePublished"
                },
                {
                    label: "Published",
                    value: "published"
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

const titleField = () =>
    createModelField({
        label: "Title",
        type: "text",
        parent: "contentReview",
        validation: [{ name: "required", message: "Value is required." }]
    });

const contentIdField = () =>
    createModelField({
        label: "Id",
        type: "text",
        parent: "contentReview Content",
        validation: [{ name: "required", message: "Value is required." }]
    });

const contentWorkflowIdField = () =>
    createModelField({
        label: "Workflow Id",
        type: "text",
        parent: "contentReview Content",
        validation: [{ name: "required", message: "Value is required." }]
    });

const contentTypeField = () =>
    createModelField({
        label: "Type",
        type: "text",
        parent: "contentReview Type",
        predefinedValues: {
            enabled: true,
            values: [
                {
                    label: "Page",
                    value: "page"
                },
                { value: "cms-entry", label: "CMS Entry" }
            ]
        },
        validation: [{ name: "required", message: "Value is required." }]
    });

const contentSettingsField = (fields: CmsModelField[]) =>
    createModelField({
        label: "Settings",
        parent: "contentReview Content",
        type: "object",
        multipleValues: false,
        settings: { fields }
    });

const contentSettingsModelIdField = () =>
    createModelField({
        label: "Model Id",
        parent: "contentReview Settings",
        type: "text"
    });

const scheduledActionIdField = () =>
    createModelField({
        label: "Scheduled action Id",
        type: "text",
        parent: "contentReview Content"
    });

const contentScheduledOnField = () =>
    createModelField({
        label: "Scheduled on",
        type: "datetime",
        parent: "contentReview Content"
    });

const contentScheduledByField = () =>
    createModelField({
        label: "Scheduled by",
        type: "text",
        parent: "contentReview Content"
    });

const contentPublishedByField = () =>
    createModelField({
        label: "Published by",
        type: "text",
        parent: "contentReview Content"
    });

const stepStatusField = (): CmsModelField => ({
    multipleValues: false,
    listValidation: [],
    renderer: {
        name: "radio-buttons"
    },
    predefinedValues: {
        enabled: true,
        values: [
            {
                value: "done",
                label: "Steps done"
            },
            {
                value: "active",
                label: "Step active"
            },
            {
                value: "inactive",
                label: "Step inactive"
            }
        ]
    },
    label: "Status",
    id: "contentReview_steps_status",
    type: "text",
    validation: [
        {
            name: "required",
            message: "Value is required."
        }
    ],
    fieldId: "status"
});

const stepPendingChangeRequests = () =>
    createModelField({
        label: "Pending change requests",
        type: "number",
        parent: "contentReview Step",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const stepTotalComments = () =>
    createModelField({
        label: "Total comments",
        type: "number",
        parent: "contentReview Step",
        validation: [
            {
                name: "required",
                message: "Value is required."
            }
        ]
    });

const latestCommentId = () =>
    createModelField({
        label: "Latest comment Id",
        type: "text",
        parent: "contentReview"
    });

const stepSignOffProvidedOn = () =>
    createModelField({
        label: "Sign off provided on",
        type: "datetime",
        parent: "contentReview Step"
    });

const stepSignOffProvidedBy = (fields: CmsModelField[]) =>
    createModelField({
        label: "Sign off provided By",
        type: "object",
        parent: "contentReview Step",
        multipleValues: false,
        settings: { fields }
    });

const stepSignOffProvidedById = () =>
    createModelField({
        label: "Id",
        type: "text",
        parent: "contentReview Step"
    });

const stepSignOffProvidedByDisplayName = () =>
    createModelField({
        label: "DisplayName",
        type: "text",
        parent: "contentReview Step"
    });

const stepsField = (fields: CmsModelField[]): CmsModelField => ({
    id: "contentReview_steps",
    label: "Steps",
    type: "object",
    settings: {
        fields,
        layout: fields.map(field => [field.fieldId])
    },
    listValidation: [],
    validation: [],
    fieldId: "steps",
    multipleValues: true,
    predefinedValues: {
        values: [],
        enabled: false
    }
});

interface CreateContentReviewModelDefinitionParams {
    reviewerModelId: string;
}

export const createContentReviewModelDefinition = ({
    reviewerModelId
}: CreateContentReviewModelDefinitionParams): WorkflowModelDefinition => ({
    name: "APW - Content Review",
    modelId: "apwContentReviewModelDefinition",
    titleFieldId: "content",
    layout: [
        ["contentReview_content"],
        ["contentReview_reviewRequestedBy"],
        ["contentReview_steps"],
        ["contentReview_changeRequested"]
    ],
    fields: [
        titleField(),
        contentField([
            contentIdField(),
            contentTypeField(),
            contentWorkflowIdField(),
            contentSettingsField([contentSettingsModelIdField()]),
            contentScheduledOnField(),
            contentScheduledByField(),
            scheduledActionIdField(),
            contentPublishedByField()
        ]),
        contentStatus(),
        stepsField([
            stepTitleField(),
            stepTypeField(),
            stepIdField(),
            stepReviewersField(reviewerModelId),
            stepStatusField(),
            stepPendingChangeRequests(),
            stepTotalComments(),
            stepSignOffProvidedOn(),
            stepSignOffProvidedBy([stepSignOffProvidedById(), stepSignOffProvidedByDisplayName()])
        ]),
        latestCommentId()
    ],
    description: ""
});
