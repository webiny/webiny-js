const { version: webinyVersion } = require("@webiny/cli/package.json");
import { CmsModel } from "~/types";

export const pageModel: CmsModel = {
    tenant: "root",
    webinyVersion,
    locale: "en-US",
    name: "Page",
    group: {
        id: "62f39c13ebe1d800091bf33c",
        name: "Ungrouped"
    },
    description: "Page",
    modelId: "page",
    savedOn: "2022-12-19T19:10:02.731Z",
    titleFieldId: "id",
    lockedFields: [],
    layout: [["kcq9kt40"], ["peeeyhtc"]],
    tags: ["type:model"],
    fields: [
        {
            id: "peeeyhtc",
            fieldId: "content",
            storageId: "dynamic-zone@peeeyhtc",
            type: "dynamicZone",
            label: "Content",
            tags: [],
            placeholderText: null,
            helpText: "Various content fragments that make up the content of the article.",
            predefinedValues: {
                enabled: false,
                values: []
            },
            multipleValues: true,
            renderer: {
                name: "dynamicZone"
            },
            validation: [],
            listValidation: [
                {
                    name: "dynamicZone",
                    settings: {},
                    message: ""
                }
            ],
            settings: {
                templates: [
                    {
                        layout: [["dwodev6q"]],
                        name: "Hero #1",
                        gqlTypeName: "Hero",
                        icon: "fas/flag",
                        description: "The top piece of content on every page.",
                        id: "cv2zf965v324ivdc7e1vt",
                        fields: [
                            {
                                renderer: {
                                    name: "text-input"
                                },
                                label: "Title",
                                id: "dwodev6q",
                                type: "text",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Value is required."
                                    }
                                ],
                                fieldId: "title"
                            }
                        ],
                        validation: [
                            {
                                name: "minLength",
                                message: "You need to add at least 1 Hero template.",
                                settings: {
                                    value: "1"
                                }
                            },
                            {
                                name: "maxLength",
                                message: "You are allowed to add no more than 2 Hero templates.",
                                settings: {
                                    value: "2"
                                }
                            }
                        ]
                    },
                    {
                        layout: [["zsmj94iu"]],
                        name: "Simple Text #1",
                        gqlTypeName: "SimpleText",
                        icon: "fas/file-text",
                        description: "Simple paragraph of text.",
                        id: "81qiz2v453wx9uque0gox",
                        fields: [
                            {
                                renderer: {
                                    name: "long-text-text-area"
                                },
                                label: "Text",
                                id: "zsmj94iu",
                                type: "long-text",
                                validation: [],
                                fieldId: "text"
                            }
                        ],
                        validation: [
                            {
                                name: "minLength",
                                message: "You need to add at least 1 Simple Text template.",
                                settings: {
                                    value: "1"
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: "kcq9kt40",
            fieldId: "header",
            storageId: "dynamic-zone@kcq9kt40",
            type: "dynamicZone",
            label: "Header",
            tags: [],
            placeholderText: null,
            helpText: "Select a page header that will be show at the top of your page.",
            predefinedValues: {
                enabled: false,
                values: []
            },
            multipleValues: false,
            renderer: {
                name: "dynamicZone"
            },
            validation: [],
            listValidation: [
                {
                    name: "dynamicZone",
                    settings: {},
                    message: ""
                }
            ],
            settings: {
                templates: [
                    {
                        name: "Text Header #1",
                        gqlTypeName: "TextHeader",
                        icon: "fas/file-text",
                        layout: [["6te8u0pe"]],
                        description: "Simple text based header.",
                        id: "g59qfds146gi4xq3tsu4n",
                        fields: [
                            {
                                renderer: {
                                    name: "text-input"
                                },
                                label: "Title",
                                id: "6te8u0pe",
                                type: "text",
                                validation: [],
                                fieldId: "title"
                            }
                        ]
                    },
                    {
                        name: "Image Header #1",
                        gqlTypeName: "ImageHeader",
                        icon: "far/image",
                        layout: [["lqp0175z"], ["1qc22e85"]],
                        description: "Text with background image.",
                        id: "k7yembax2xpbt7f2sobi2",
                        fields: [
                            {
                                renderer: {
                                    name: "text-input"
                                },
                                label: "Title",
                                id: "lqp0175z",
                                type: "text",
                                validation: [],
                                fieldId: "title"
                            },
                            {
                                settings: {
                                    imagesOnly: true
                                },
                                renderer: {
                                    name: "file-input"
                                },
                                label: "Image",
                                id: "1qc22e85",
                                type: "file",
                                validation: [],
                                fieldId: "image"
                            }
                        ]
                    }
                ]
            }
        }
    ]
};
