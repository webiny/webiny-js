import { createModelField } from "../utils";

const contentField = () =>
    createModelField({ label: "Content", parent: "contentReview", type: "text" });

const requestedByField = () => ({
    id: "contentReview_reviewRequestedBy",
    fieldId: "reviewRequestedBy",
    label: "Review requested by",
    type: "text",
    settings: {},
    listValidation: [],
    validation: [],
    multipleValues: false,
    predefinedValues: {
        values: [],
        enabled: false
    }
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

const changeRequestedTitleField = () => ({
    renderer: {
        name: "text-input"
    },
    label: "Title",
    id: "contentReview_changeRequested_title",
    type: "text",
    validation: [
        {
            name: "required",
            message: "Value is required."
        }
    ],
    fieldId: "title"
});

const changeRequestedBodyField = () => ({
    renderer: {
        name: "rich-text-input"
    },
    label: "Body",
    id: "contentReview_changeRequested_body",
    type: "rich-text",
    validation: [],
    fieldId: "body"
});

const changeRequestedMediaField = () => ({
    renderer: {
        name: "file-input"
    },
    label: "Media",
    id: "contentReview_changeRequested_media",
    type: "file",
    validation: [],
    fieldId: "media"
});

const changeRequestedStepField = () => ({
    renderer: {
        name: "text-input"
    },
    label: "Step",
    id: "contentReview_changeRequested_step",
    type: "text",
    validation: [
        {
            name: "required",
            message: "Value is required."
        }
    ],
    fieldId: "step"
});

const changeRequestedResolvedField = () => ({
    renderer: {
        name: "boolean-input"
    },
    label: "Resolved",
    id: "contentReview_changeRequested__resolved",
    type: "boolean",
    validation: [],
    fieldId: "resolved"
});

const changeRequestedCommentField = fields => ({
    label: "Comments",
    id: "contentReview_changeRequested_comment",
    type: "object",
    validation: [],
    fieldId: "comments",
    multipleValues: true,
    settings: {
        fields: fields,
        layout: fields.map(field => [field.fieldId])
    },
    listValidation: [],
    renderer: {
        name: "objects"
    }
});

const commentBodyField = () => ({
    renderer: {
        name: "rich-text-input"
    },
    label: "Body",
    id: "contentReview_changeRequested_comment_body",
    type: "rich-text",
    validation: [],
    fieldId: "body"
});

const commentAuthorField = () => ({
    renderer: {
        name: "text-input"
    },
    label: "Author",
    id: "contentReview_changeRequested_comment_author",
    type: "text",
    validation: [
        {
            name: "required",
            message: "Value is required."
        }
    ],
    fieldId: "author"
});

const changeRequestedField = fields => ({
    id: "contentReview_changeRequested",
    fieldId: "changeRequested",
    label: "Change Requested",
    type: "object",
    settings: {
        fields: fields,
        layout: fields.map(field => [field.fieldId])
    },
    listValidation: [],
    validation: [],
    multipleValues: true,
    predefinedValues: {
        values: [],
        enabled: false
    }
});

export const contentReviewModelDefinition = {
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
        contentField(),
        requestedByField(),
        stepsField([stepStatusField(), stepSlugField()]),
        changeRequestedField([
            changeRequestedTitleField(),
            changeRequestedBodyField(),
            changeRequestedMediaField(),
            changeRequestedStepField(),
            changeRequestedResolvedField(),
            changeRequestedCommentField([commentBodyField(), commentAuthorField()])
        ])
    ]
};
