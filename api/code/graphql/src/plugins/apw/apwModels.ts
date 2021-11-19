import { CmsModelPlugin } from "@webiny/api-headless-cms/content/plugins/CmsModelPlugin";
import { CmsGroup, CmsGroupPlugin } from "@webiny/api-headless-cms/content/plugins/CmsGroupPlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

const createContentModelPlugin = ({ group, locale }: { group: CmsGroup; locale: string }) =>
    new CmsModelPlugin({
        name: "APW - Workflow",
        modelId: "apwWorkflow",
        locale: locale,
        group: {
            id: group.id,
            name: group.name
        },
        layout: [["V6NTO38Zu"], ["qIuudSc8F"], ["KfnI2CteW"], ["KfnI2Ctec"]],
        titleFieldId: "title",
        description: null,
        fields: [
            {
                type: "text",
                fieldId: "title",
                id: "V6NTO38Zu",
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
                id: "qIuudSc8F",
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
                            id: "S1dfh7k2F",
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
                            id: "nw_vWiXcb",
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
                            id: "Vh5-lighE",
                            type: "ref",
                            validation: [],
                            fieldId: "reviewers"
                        }
                    ],
                    layout: [["nw_vWiXcb"], ["S1dfh7k2F"], ["Vh5-lighE"]]
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
                id: "KfnI2CteW",
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
                            id: "W3r2V5EAK",
                            type: "text",
                            validation: [
                                {
                                    name: "required",
                                    message: "Value is required."
                                }
                            ],
                            fieldId: "type"
                        }
                    ],
                    layout: [["W3r2V5EAK"]]
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
                id: "KfnI2Ctec",
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
                    values: [{ label: "Page Builder", value: "pageBuilder" }]
                }
            }
        ]
    });

const createApwModelGroup = () =>
    new ContextPlugin<CmsContext>(async context => {
        context.security.disableAuthorization();

        const groupId = "contentModelGroup_apw";
        // Create a CmsGroup.
        context.plugins.register(
            new CmsGroupPlugin({
                id: groupId,
                slug: "apw",
                name: "APW",
                description: "Group for Advanced Publishing Workflow"
            })
        );
        const group = await context.cms.getGroup(groupId);
        // Create a CmsModel that represents "WorkFlow".
        context.plugins.register(createContentModelPlugin({ group, locale: context.cms.locale }));

        context.security.enableAuthorization();
    });

export default () => [createApwModelGroup()];
