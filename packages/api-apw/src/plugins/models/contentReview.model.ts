import { createModelField } from "../utils";

const contentField = fields =>
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

const contentIdField = () =>
    createModelField({
        label: "Id",
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

const contentSettingsField = () =>
    createModelField({
        label: "Settings",
        type: "text",
        parent: "contentReview Settings"
    });

const stepStatusField = () => ({
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

const stepSlugField = () => ({
    renderer: {
        name: "text-input"
    },
    label: "Slug",
    id: "contentReview_steps_slug",
    type: "text",
    validation: [
        {
            name: "required",
            message: "Value is required."
        }
    ],
    fieldId: "slug"
});

const stepPendingChangeRequests = () =>
    createModelField({
        label: "Pending change requests",
        type: "number",
        parent: "contentReview Step"
    });

const stepsField = fields => ({
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

export const createContentReviewModelDefinition = () => ({
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
        contentField([contentIdField(), contentTypeField(), contentSettingsField()]),
        stepsField([stepStatusField(), stepSlugField(), stepPendingChangeRequests()])
    ]
});
