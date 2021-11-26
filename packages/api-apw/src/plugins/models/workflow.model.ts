export const workflowModelDefinition = {
    name: "APW - Workflow",
    /**
     * Id of the model cannot be appWorkflow because it clashes with the GraphQL types for APW.
     */
    modelId: "apwWorkflowModelDefinition",
    layout: [["workflow_title"], ["workflow_steps"], ["workflow_scope"], ["workflow_app"]],
    titleFieldId: "title",
    description: null,
    fields: [
        {
            type: "text",
            fieldId: "title",
            id: "workflow_title",
            settings: {},
            label: "Title",
            validation: [
                {
                    message: "Value is required.",
                    name: "required"
                }
            ],
            multipleValues: false,
            predefinedValues: {
                enabled: false,
                values: []
            }
        },
        {
            type: "object",
            fieldId: "steps",
            id: "workflow_steps",
            settings: {
                fields: [
                    {
                        renderer: {
                            name: "radio-buttons"
                        },
                        helpText: null,
                        predefinedValues: {
                            enabled: true,
                            values: [
                                {
                                    value: "mandatory_blocking",
                                    label: "Mandatory, blocking  - An approval from a reviewer is required before being able to move to the next step and publish the content. "
                                },
                                {
                                    value: "mandatory_non-blocking",
                                    label: "Mandatory, non-blocking - An approval from a reviewer is to publish the content, but the next step in the review workflow is not blocked. "
                                },
                                {
                                    value: "optional",
                                    label: "Not mandatory - This is an optional review step. The content can be published regardless if an approval is provided or not."
                                }
                            ]
                        },
                        label: "Type",
                        id: "workflow_step_type",
                        type: "text",
                        validation: [
                            {
                                name: "required",
                                message: "Value is required."
                            }
                        ],
                        fieldId: "type"
                    },
                    {
                        renderer: {
                            name: "text-input"
                        },
                        helpText: "What will be it called",
                        placeholderText: "Add text",
                        label: "Title",
                        id: "workflow_step_title",
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
                        multipleValues: true,
                        settings: {
                            models: [
                                {
                                    modelId: "reviewer"
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
                        ],
                        renderer: {
                            name: "ref-inputs"
                        },
                        helpText: "Assign users whom approval is needed",
                        label: "Reviewers",
                        id: "workflow_step_reviewers",
                        type: "ref",
                        validation: [],
                        fieldId: "reviewers"
                    }
                ],
                layout: [
                    ["workflow_step_type"],
                    ["workflow_step_title"],
                    ["workflow_step_reviewers"]
                ]
            },
            label: "Steps",
            validation: [],
            multipleValues: true,
            predefinedValues: {
                enabled: false,
                values: []
            }
        },
        {
            type: "object",
            fieldId: "scope",
            id: "workflow_scope",
            settings: {
                fields: [
                    {
                        renderer: {
                            name: "radio-buttons"
                        },
                        predefinedValues: {
                            enabled: true,
                            values: [
                                {
                                    value: "default",
                                    label: "Default  - Catch all scope that applies to all content that's being published."
                                },
                                {
                                    value: "pb_category",
                                    label: "Page category (Page Builder only) - The workflow will apply to all pages inside specific categories."
                                },
                                {
                                    value: "cms_model",
                                    label: "Content model (Headless CMS only) - The workflow will apply to all the content inside the specific content models. "
                                },
                                {
                                    value: "specific",
                                    label: "Specific content - The workflow will apply to specific pages, or content model entries."
                                }
                            ]
                        },
                        label: "Type",
                        id: "workflow_scope_type",
                        type: "text",
                        validation: [
                            {
                                name: "required",
                                message: "Value is required."
                            }
                        ],
                        fieldId: "type"
                    },
                    {
                        renderer: {
                            name: "radio-buttons"
                        },
                        predefinedValues: {
                            enabled: false,
                            values: []
                        },
                        label: "Data",
                        id: "workflow_scope_data",
                        type: "object",
                        validation: [],
                        fieldId: "data",
                        settings: {
                            fields: [
                                {
                                    renderer: {
                                        name: "text-input"
                                    },
                                    predefinedValues: {
                                        enabled: false,
                                        values: []
                                    },
                                    label: "Values",
                                    id: "workflow_scope_data_value",
                                    type: "text",
                                    validation: [],
                                    fieldId: "values",
                                    multipleValues: true
                                }
                            ]
                        }
                    }
                ],
                layout: [["workflow_scope_type"]]
            },
            label: "Scope",
            validation: [],
            multipleValues: false,
            predefinedValues: {
                enabled: false,
                values: []
            }
        },
        {
            id: "workflow_app",
            fieldId: "app",
            settings: {},
            type: "text",
            label: "Application",
            validation: [
                {
                    name: "required",
                    message: "Value is required."
                }
            ],
            multipleValues: false,
            predefinedValues: {
                enabled: true,
                values: [
                    { label: "Page Builder", value: "pageBuilder" },
                    { label: "Headless CMS", value: "cms" }
                ]
            }
        }
    ]
};
