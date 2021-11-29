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
        {
            id: "contentReview_content",
            fieldId: "content",
            label: "Content",
            type: "text",
            settings: {},
            listValidation: [],
            validation: [],
            multipleValues: false,
            predefinedValues: {
                values: [],
                enabled: false
            }
        },
        {
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
        },
        {
            id: "contentReview_steps",
            label: "Steps",
            type: "object",
            settings: {
                fields: [
                    {
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
                    },
                    {
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
                    }
                ],
                layout: [["contentReview_steps_status"], ["contentReview_steps_slug"]]
            },
            listValidation: [],
            validation: [],
            fieldId: "steps",
            multipleValues: true,
            predefinedValues: {
                values: [],
                enabled: false
            }
        },
        {
            id: "contentReview_changeRequested",
            fieldId: "changeRequested",
            label: "Change Requested",
            type: "object",
            settings: {
                fields: [
                    {
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
                    },
                    {
                        renderer: {
                            name: "rich-text-input"
                        },
                        label: "Body",
                        id: "contentReview_changeRequested_body",
                        type: "rich-text",
                        validation: [],
                        fieldId: "body"
                    },
                    {
                        renderer: {
                            name: "file-input"
                        },
                        label: "Media",
                        id: "contentReview_changeRequested_media",
                        type: "file",
                        validation: [],
                        fieldId: "media"
                    },
                    {
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
                    },
                    {
                        renderer: {
                            name: "boolean-input"
                        },
                        label: "Resolved",
                        id: "contentReview_changeRequested__resolved",
                        type: "boolean",
                        validation: [],
                        fieldId: "resolved"
                    },
                    {
                        label: "Comments",
                        id: "contentReview_changeRequested_comment",
                        type: "object",
                        validation: [],
                        fieldId: "comments",
                        multipleValues: true,
                        settings: {
                            fields: [
                                {
                                    renderer: {
                                        name: "rich-text-input"
                                    },
                                    label: "Body",
                                    id: "contentReview_changeRequested_comment_body",
                                    type: "rich-text",
                                    validation: [],
                                    fieldId: "body"
                                },
                                {
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
                                }
                            ],
                            layout: [
                                ["contentReview_changeRequested_comment_body"],
                                ["contentReview_changeRequested_comment_author"]
                            ]
                        },
                        listValidation: [],
                        renderer: {
                            name: "objects"
                        }
                    }
                ],
                layout: [
                    ["contentReview_changeRequested_title"],
                    ["UXN-contentReview_changeRequested_body"],
                    ["contentReview_changeRequested_media"],
                    ["contentReview_changeRequested_step"],
                    ["contentReview_changeRequested_resolved"],
                    ["contentReview_changeRequested_comment"]
                ]
            },
            listValidation: [],
            validation: [],
            multipleValues: true,
            predefinedValues: {
                values: [],
                enabled: false
            }
        }
    ]
};
