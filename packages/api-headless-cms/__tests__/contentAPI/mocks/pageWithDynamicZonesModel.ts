const { version: webinyVersion } = require("@webiny/cli/package.json");
import {
    CmsModel as BaseCmsModel,
    CmsModelField as BaseCmsModelField,
    CmsModelFieldSettings as BaseCmsModelFieldSettings
} from "~/types";

type CmsModelField = Omit<BaseCmsModelField, "storageId" | "settings"> & {
    settings: CmsModelFieldSettings;
};

interface CmsModelFieldSettings extends Omit<BaseCmsModelFieldSettings, "fields"> {
    fields?: CmsModelField[];
}

interface CmsModel extends Omit<BaseCmsModel, "fields"> {
    fields: CmsModelField[];
}

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
    singularApiName: "PageModelApiName",
    pluralApiName: "PagesModelApiName",
    savedOn: "2022-12-19T19:10:02.731Z",
    titleFieldId: "id",
    lockedFields: [],
    layout: [
        ["kcq9kt40"],
        ["peeeyhtc"],
        ["t4pfesadsa"],
        ["ahterwfesi2"],
        ["rethawfesi2"],
        ["ahterwfesi3"],
        ["ngrejnoxj0wax"]
    ],
    tags: ["type:model"],
    fields: [
        {
            id: "peeeyhtc",
            fieldId: "content",
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
                    },
                    {
                        layout: [["ttyh493ugfd"], ["nli9u1rm"], ["lsd78slxc8"]],
                        name: "Objecting",
                        gqlTypeName: "Objecting",
                        icon: "fas/file-text",
                        description: "Objecting test.",
                        id: "9ht43gurhegkbdfsaafyads",
                        fields: [
                            {
                                id: "ttyh493ugfd",
                                fieldId: "nestedObject",
                                label: "Nested Object",
                                type: "object",
                                settings: {
                                    fields: [
                                        {
                                            id: "rt3uhvds",
                                            fieldId: "objectTitle",
                                            type: "text",
                                            label: "Object title",
                                            validation: [
                                                {
                                                    name: "required",
                                                    message: `"nestedObject.objectTitle" is required.`
                                                }
                                            ]
                                        },
                                        {
                                            id: "r329gdfhsaufdsa",
                                            fieldId: "objectNestedObject",
                                            type: "object",
                                            label: "Object nested object",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    {
                                                        id: "g9huerprgds",
                                                        fieldId: "nestedObjectNestedTitle",
                                                        type: "text",
                                                        label: "Nested object nested title",
                                                        validation: [
                                                            {
                                                                name: "required",
                                                                message: `"nestedObject.objectNestedObject.nestedObjectNestedTitle" is required.`
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                },
                                renderer: {
                                    name: "dynamicZone"
                                }
                            },
                            {
                                type: "dynamicZone",
                                settings: {
                                    templates: [
                                        {
                                            name: "SuperNestedObject",
                                            gqlTypeName: "SuperNestedObject",
                                            icon: "fab/buysellads",
                                            description: "SuperNestedObject",
                                            id: "0emukbsvmzpozx2lzk883",
                                            fields: [
                                                {
                                                    type: "ref",
                                                    settings: {
                                                        models: [
                                                            {
                                                                modelId: "author"
                                                            }
                                                        ]
                                                    },
                                                    validation: [],
                                                    renderer: {
                                                        name: "ref-inputs"
                                                    },
                                                    multipleValues: true,
                                                    listValidation: [],
                                                    label: "Authors",
                                                    fieldId: "authors",
                                                    id: "tuuehcqp"
                                                }
                                            ],
                                            layout: [["tuuehcqp"]]
                                        }
                                    ]
                                },
                                renderer: {
                                    name: "dynamicZone"
                                },
                                validation: [],
                                label: "DynamicZone",
                                fieldId: "dynamicZone",
                                id: "nli9u1rm"
                            },
                            /**
                             * Add a dynamic zone field without any templates, to test for correct schema generation.
                             */
                            {
                                type: "dynamicZone",
                                settings: {
                                    templates: []
                                },
                                renderer: {
                                    name: "dynamicZone"
                                },
                                validation: [],
                                label: "DynamicZone",
                                fieldId: "emptyDynamicZone",
                                id: "lsd78slxc8"
                            }
                        ]
                    },
                    {
                        layout: [["jms49ui"], ["xcv50da"]],
                        name: "Author",
                        gqlTypeName: "Author",
                        icon: "fas/file-text",
                        description: "Reference to an Author.",
                        id: "qi81z2v453wx9uque0gox",
                        validation: [
                            {
                                name: "minLength",
                                message: "You need to add at least 1 Simple Text template.",
                                settings: {
                                    value: "1"
                                }
                            }
                        ],
                        fields: [
                            {
                                id: "jms49ui",
                                multipleValues: false,
                                helpText: "",
                                label: "Author",
                                fieldId: "author",
                                type: "ref",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Please select an author"
                                    }
                                ],
                                listValidation: [],
                                settings: {
                                    models: [{ modelId: "author" }]
                                },
                                placeholderText: "placeholder text",
                                predefinedValues: {
                                    enabled: false,
                                    values: []
                                },
                                renderer: {
                                    name: "renderer"
                                }
                            },
                            {
                                id: "xcv50da",
                                multipleValues: true,
                                helpText: "",
                                label: "Authors",
                                fieldId: "authors",
                                type: "ref",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Please select some authors"
                                    }
                                ],
                                listValidation: [],
                                settings: {
                                    models: [{ modelId: "author" }]
                                },
                                placeholderText: "placeholder text",
                                predefinedValues: {
                                    enabled: false,
                                    values: []
                                },
                                renderer: {
                                    name: "renderer"
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
        },
        {
            id: "t4pfesadsa",
            fieldId: "objective",
            type: "dynamicZone",
            label: "Objective",
            settings: {
                templates: [
                    {
                        layout: [["ngutrblkf"]],
                        name: "Objecting",
                        gqlTypeName: "Objecting",
                        icon: "fas/file-text",
                        description: "Objecting test.",
                        id: "t804h3gufashguasffds",
                        fields: [
                            {
                                id: "ngutrblkf",
                                fieldId: "nestedObject",
                                label: "Nested Object",
                                type: "object",
                                settings: {
                                    fields: [
                                        {
                                            id: "gpbebgjbefs",
                                            fieldId: "objectTitle",
                                            type: "text",
                                            label: "Object title"
                                        },
                                        {
                                            id: "ijg4ufdsundsj",
                                            fieldId: "objectBody",
                                            type: "rich-text",
                                            label: "Object body"
                                        },
                                        {
                                            id: "xj0waxngrejno",
                                            fieldId: "objectNestedObject",
                                            type: "object",
                                            label: "Object nested object",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    {
                                                        id: "hpgtierghpiue",
                                                        fieldId: "nestedObjectNestedTitle",
                                                        type: "text",
                                                        label: "Nested object nested title",
                                                        validation: [
                                                            {
                                                                name: "required",
                                                                message: `"nestedObjectNestedTitle" is required.`
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                },
                                renderer: {
                                    name: "dynamicZone"
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: "ahterwfesi2",
            fieldId: "reference",
            helpText: "Single-value DZ with 2 templates",
            type: "dynamicZone",
            label: "Reference",
            settings: {
                templates: [
                    {
                        layout: [["gt409u8qhgoudsahfds"]],
                        name: "AuthorReference Field",
                        gqlTypeName: "Author",
                        icon: "fas/file-text",
                        description: "Reference field test.",
                        id: "tg9u4h3qgfsauighafs",
                        fields: [
                            {
                                id: "gt409u8qhgoudsahfds",
                                fieldId: "author",
                                label: "Reference Field",
                                type: "ref",
                                settings: {
                                    models: [
                                        {
                                            modelId: "author"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: "rethawfesi2",
            fieldId: "references1",
            helpText: "Single value DZ with multi-value ref field.",
            type: "dynamicZone",
            multipleValues: false,
            label: "Reference",
            settings: {
                templates: [
                    {
                        layout: [["gt409u8qhgoudsahfds"]],
                        name: "AuthorReference Field",
                        gqlTypeName: "Authors",
                        icon: "fas/file-text",
                        description: "Reference field test.",
                        id: "tg9u4h3qgfsauighafs",
                        fields: [
                            {
                                id: "gt409u8qhgoudsahfds",
                                multipleValues: true,
                                fieldId: "authors",
                                label: "Reference Field",
                                type: "ref",
                                settings: {
                                    models: [
                                        {
                                            modelId: "author"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: "ahterwfesi3",
            fieldId: "references2",
            helpText: "Multi-value DZ with a single-value ref field.",
            type: "dynamicZone",
            multipleValues: true,
            label: "Reference",
            settings: {
                templates: [
                    {
                        layout: [["gt409u8qhgoudsahfds"]],
                        name: "AuthorReference Field",
                        gqlTypeName: "Author",
                        icon: "fas/file-text",
                        description: "Reference field test.",
                        id: "tg9u4h3qgfsauighafs",
                        fields: [
                            {
                                id: "gt409u8qhgoudsahfds",
                                fieldId: "author",
                                label: "Reference Field",
                                type: "ref",
                                settings: {
                                    models: [
                                        {
                                            modelId: "author"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        },
        /**
         *  Dynamic zone without templates will be skipped in the SDL generation process.
         *  This means that the parent `object` field will have 0 child fields.
         *  For that reason, we expect a GQL type with an `_empty: String` field.
         */
        {
            id: "ngrejnoxj0wax",
            fieldId: "ghostObject",
            type: "object",
            label: "Object that will generate a type with an _empty field.",
            settings: {
                fields: [
                    {
                        id: "rghpiuehpgtie",
                        fieldId: "emptyDynamicZone",
                        type: "dynamicZone",
                        label: "Dynamic zone without templates",
                        settings: {
                            templates: []
                        }
                    }
                ]
            }
        }
    ]
};
