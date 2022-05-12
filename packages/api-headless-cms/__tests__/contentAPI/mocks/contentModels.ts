import contentModelGroup from "./contentModelGroup";
import { generateAlphaNumericId } from "@webiny/utils";
import { CmsModel } from "~/types";

const { version: webinyVersion } = require("@webiny/cli/package.json");

export interface Fruit {
    id?: string;
    entryId?: string;
    name: string;
    isSomething: boolean;
    rating: number;
    numbers: number[];
    email: string;
    url: string;
    lowerCase: string;
    upperCase: string;
    date: string;
    dateTime: string;
    dateTimeZ: string;
    time: string;
    description: string;
    slug?: string | null;
}

const ids = {
    // product category
    field11: generateAlphaNumericId(),
    field12: generateAlphaNumericId(),
    // product
    field201: generateAlphaNumericId(),
    field202: generateAlphaNumericId(),
    field203: generateAlphaNumericId(),
    field204: generateAlphaNumericId(),
    field205: generateAlphaNumericId(),
    field206: generateAlphaNumericId(),
    field207: generateAlphaNumericId(),
    field208: generateAlphaNumericId(),
    field209: generateAlphaNumericId(),
    field210: generateAlphaNumericId(),
    field211: generateAlphaNumericId(),
    field212: generateAlphaNumericId(),
    field213: generateAlphaNumericId(),
    field214: generateAlphaNumericId(),
    field215: generateAlphaNumericId(),
    field216: generateAlphaNumericId(),
    field217: generateAlphaNumericId(),
    field218: generateAlphaNumericId(),
    field219: generateAlphaNumericId(),
    field220: generateAlphaNumericId(),
    // product review
    field31: generateAlphaNumericId(),
    field32: generateAlphaNumericId(),
    field33: generateAlphaNumericId(),
    field34: generateAlphaNumericId(),
    // author
    field40: generateAlphaNumericId(),
    // fruit
    field501: generateAlphaNumericId(),
    field502: generateAlphaNumericId(),
    field503: generateAlphaNumericId(),
    field504: generateAlphaNumericId(),
    field505: generateAlphaNumericId(),
    field506: generateAlphaNumericId(),
    field507: generateAlphaNumericId(),
    field508: generateAlphaNumericId(),
    field509: generateAlphaNumericId(),
    field510: generateAlphaNumericId(),
    field511: generateAlphaNumericId(),
    field512: generateAlphaNumericId(),
    field513: generateAlphaNumericId(),
    field514: generateAlphaNumericId(),
    // bug
    field601: generateAlphaNumericId(),
    field602: generateAlphaNumericId(),
    field603: generateAlphaNumericId(),
    field604: generateAlphaNumericId(),
    // article
    field701: generateAlphaNumericId(),
    field702: generateAlphaNumericId(),
    field703: generateAlphaNumericId(),
    field704: generateAlphaNumericId()
};

const models: CmsModel[] = [
    // category
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        description: "Product category",
        modelId: "category",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field11], [ids.field12]],
        fields: [
            {
                id: ids.field11,
                multipleValues: false,
                helpText: "",
                label: "Title",
                type: "text",
                fieldId: `title@text@${ids.field11}`,
                alias: "title",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
                    },
                    {
                        name: "minLength",
                        message: "Enter at least 3 characters",
                        settings: {
                            min: 3.0
                        }
                    }
                ],
                listValidation: [],
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
                id: ids.field12,
                multipleValues: false,
                helpText: "",
                label: "Slug",
                type: "text",
                fieldId: `slug@text@${ids.field12}`,
                alias: "slug",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        tenant: "root",
        webinyVersion
    },
    // product
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Product",
        modelId: "product",
        description: "Products being sold in our webshop",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [
            [ids.field201],
            [ids.field202],
            [ids.field203],
            [ids.field204],
            [ids.field205],
            [ids.field206],
            [ids.field207],
            [ids.field208],
            [ids.field209],
            [ids.field210],
            [ids.field211],
            [ids.field220]
        ],
        fields: [
            {
                id: ids.field201,
                multipleValues: false,
                helpText: "",
                label: "Title",
                fieldId: `title@text@${ids.field201}`,
                alias: "title",
                type: "text",
                validation: [
                    {
                        name: "required",
                        message: "Please enter a product name"
                    }
                ],
                listValidation: [],
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
                id: ids.field202,
                multipleValues: false,
                helpText: "",
                label: "Category",
                fieldId: `category@ref@${ids.field202}`,
                alias: "category",
                type: "ref",
                validation: [
                    {
                        name: "required",
                        message: "Please select a category"
                    }
                ],
                listValidation: [],
                settings: {
                    models: [{ modelId: "category" }]
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
                id: ids.field203,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: `price@number@${ids.field203}`,
                alias: "price",
                type: "number",
                validation: [
                    {
                        name: "required",
                        message: "Please enter a price"
                    }
                ],
                listValidation: [],
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
                id: ids.field204,
                multipleValues: false,
                helpText: "",
                label: "In Stock",
                fieldId: `inStock@boolean@${ids.field204}`,
                alias: "inStock",
                type: "boolean",
                validation: [],
                listValidation: [],
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
                id: ids.field205,
                multipleValues: false,
                helpText: "",
                label: "Items In Stock",
                fieldId: `itemsInStock@number@${ids.field205}`,
                alias: "itemsInStock",
                type: "number",
                validation: [],
                listValidation: [],
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
                id: ids.field206,
                multipleValues: false,
                helpText: "",
                label: "Available on",
                fieldId: `availableOn@datetime@${ids.field206}`,
                alias: "availableOn",
                type: "datetime",
                settings: {
                    type: "date"
                },
                validation: [],
                listValidation: [],
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
                id: ids.field207,
                multipleValues: false,
                helpText: "",
                label: "Color",
                fieldId: `color@text@${ids.field207}`,
                alias: "color",
                type: "text",
                settings: {
                    type: "text"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please select a color"
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "white",
                            value: "white"
                        },
                        {
                            label: "black",
                            value: "black"
                        },
                        {
                            label: "blue",
                            value: "blue"
                        },
                        {
                            label: "red",
                            value: "red"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field208,
                multipleValues: true,
                helpText: "",
                label: "Available sizes",
                fieldId: `availableSizes@text@${ids.field208}`,
                alias: "availableSizes",
                type: "text",
                settings: {
                    type: "text"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please select from list of sizes"
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "s",
                            value: "s"
                        },
                        {
                            label: "m",
                            value: "m"
                        },
                        {
                            label: "l",
                            value: "l"
                        },
                        {
                            label: "xl",
                            value: "xl"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field209,
                multipleValues: false,
                helpText: "Upload an image of the product",
                label: "Image",
                fieldId: `image@file@${ids.field209}`,
                alias: "image",
                type: "file",
                settings: {
                    type: "file"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please upload an image of the product"
                    }
                ],
                listValidation: [],
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
                id: ids.field210,
                multipleValues: false,
                helpText: "Rich text",
                label: "Rich text",
                fieldId: `richText@rich-text@${ids.field210}`,
                alias: "richText",
                type: "rich-text",
                settings: {
                    type: "text"
                },
                validation: [],
                listValidation: [],
                placeholderText: "Rich text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field211,
                multipleValues: false,
                helpText: "",
                label: "Variant",
                fieldId: `variant@object@${ids.field211}`,
                alias: "variant",
                type: "object",
                settings: {
                    fields: [
                        {
                            id: ids.field212,
                            multipleValues: false,
                            helpText: "",
                            label: "Name",
                            fieldId: `name@text@${ids.field212}`,
                            alias: "name",
                            type: "text",
                            settings: {
                                type: "text"
                            },
                            validation: [],
                            listValidation: [],
                            placeholderText: "",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            },
                            renderer: {
                                name: "renderer"
                            }
                        },
                        {
                            id: ids.field213,
                            multipleValues: false,
                            helpText: "",
                            label: "Price",
                            fieldId: `price@number@${ids.field213}`,
                            alias: "price",
                            type: "number",
                            settings: {
                                type: "number"
                            },
                            validation: [],
                            listValidation: [],
                            placeholderText: "",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            },
                            renderer: {
                                name: "renderer"
                            }
                        },
                        {
                            id: ids.field217,
                            multipleValues: false,
                            helpText: "",
                            label: "Category",
                            fieldId: `category@ref@${ids.field217}`,
                            alias: "category",
                            type: "ref",
                            validation: [
                                {
                                    name: "required",
                                    message: "Please select a category"
                                }
                            ],
                            listValidation: [],
                            settings: {
                                models: [{ modelId: "category" }]
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
                            id: ids.field214,
                            multipleValues: true,
                            helpText: "",
                            label: "Options",
                            fieldId: `options@object@${ids.field214}`,
                            alias: "options",
                            type: "object",
                            settings: {
                                fields: [
                                    {
                                        id: ids.field215,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Name",
                                        fieldId: `name@text@${ids.field215}`,
                                        alias: "name",
                                        type: "text",
                                        settings: {
                                            type: "text"
                                        },
                                        validation: [],
                                        listValidation: [],
                                        placeholderText: "",
                                        predefinedValues: {
                                            enabled: false,
                                            values: []
                                        },
                                        renderer: {
                                            name: "renderer"
                                        }
                                    },
                                    {
                                        id: ids.field216,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Price",
                                        fieldId: `price@number@${ids.field216}`,
                                        alias: "price",
                                        type: "number",
                                        settings: {
                                            type: "number"
                                        },
                                        validation: [],
                                        listValidation: [],
                                        placeholderText: "",
                                        predefinedValues: {
                                            enabled: false,
                                            values: []
                                        },
                                        renderer: {
                                            name: "renderer"
                                        }
                                    },
                                    {
                                        id: ids.field218,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Category",
                                        fieldId: `category@ref@${ids.field218}`,
                                        alias: "category",
                                        type: "ref",
                                        validation: [
                                            {
                                                name: "required",
                                                message: "Please select a category"
                                            }
                                        ],
                                        listValidation: [],
                                        settings: {
                                            models: [{ modelId: "category" }]
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
                                        id: ids.field219,
                                        multipleValues: true,
                                        helpText: "",
                                        label: "Categories",
                                        fieldId: `categories@ref@${ids.field219}`,
                                        alias: "categories",
                                        type: "ref",
                                        validation: [],
                                        listValidation: [],
                                        settings: {
                                            models: [{ modelId: "category" }]
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
                            },
                            validation: [],
                            listValidation: [],
                            placeholderText: "",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            },
                            renderer: {
                                name: "renderer"
                            }
                        }
                    ]
                },
                validation: [],
                listValidation: [],
                placeholderText: "",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field220,
                multipleValues: false,
                helpText: "",
                label: "No fields object",
                fieldId: `fieldsObject@object@${ids.field220}`,
                alias: "fieldsObject",
                type: "object",
                settings: {
                    layout: [[ids.field31]],
                    fields: [
                        {
                            id: ids.field31,
                            multipleValues: false,
                            helpText: "",
                            label: "Text",
                            type: "text",
                            fieldId: `text@text@${ids.field31}`,
                            alias: "text",
                            validation: [
                                {
                                    name: "required",
                                    message: "This field is required"
                                }
                            ],
                            listValidation: [],
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
                },
                validation: [],
                listValidation: [],
                placeholderText: "",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        tenant: "root",
        webinyVersion
    },
    // product review
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "text",
        lockedFields: [],
        name: "Review",
        description: "Product review",
        modelId: "review",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field31], [ids.field32], [ids.field33], [ids.field34]],
        fields: [
            {
                id: ids.field31,
                multipleValues: false,
                helpText: "",
                label: "Text",
                type: "text",
                fieldId: `text@text@${ids.field31}`,
                alias: "text",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
                    }
                ],
                listValidation: [],
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
                id: ids.field32,
                multipleValues: false,
                helpText: "",
                label: "Product",
                type: "ref",
                fieldId: `product@ref@${ids.field32}`,
                alias: "product",
                validation: [],
                listValidation: [],
                settings: {
                    models: [{ modelId: "product" }]
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
                id: ids.field33,
                multipleValues: false,
                helpText: "",
                label: "Rating",
                type: "number",
                fieldId: `rating@number@${ids.field33}`,
                alias: "rating",
                validation: [],
                listValidation: [],
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
                id: ids.field34,
                multipleValues: false,
                helpText: "",
                label: "Author",
                type: "ref",
                fieldId: `author@ref@${ids.field34}`,
                alias: "author",
                validation: [],
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
        ],
        tenant: "root",
        webinyVersion
    },
    // author
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "fullName",
        lockedFields: [],
        name: "Author",
        description: "Author",
        modelId: "author",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field40]],
        fields: [
            {
                id: ids.field40,
                multipleValues: false,
                helpText: "",
                label: "Full name",
                type: "text",
                fieldId: `fullName@text@${ids.field40}`,
                alias: "fullName",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        tenant: "root",
        webinyVersion
    },
    // fruit
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "name",
        lockedFields: [],
        name: "Fruit",
        description: "Fruit",
        modelId: "fruit",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [
            [ids.field501],
            [ids.field502],
            [ids.field503],
            [ids.field504],
            [ids.field505],
            [ids.field506],
            [ids.field507],
            [ids.field508],
            [ids.field509],
            [ids.field510],
            [ids.field511],
            [ids.field512],
            [ids.field513],
            [ids.field514]
        ],
        fields: [
            // required, minLength, maxLength
            {
                id: ids.field501,
                multipleValues: false,
                helpText: "",
                label: "Name",
                type: "text",
                fieldId: `name@text@${ids.field501}`,
                alias: "name",
                validation: [
                    {
                        name: "required",
                        message: "This field is required."
                    },
                    {
                        name: "minLength",
                        message: "Min length is 2.",
                        settings: {
                            value: 2
                        }
                    },
                    {
                        name: "maxLength",
                        message: "Max length is 15.",
                        settings: {
                            value: 15
                        }
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // multipleValues: required, gte, lte, minLength, maxLength
            {
                id: ids.field502,
                multipleValues: true,
                helpText: "",
                label: "Numbers",
                type: "number",
                fieldId: `numbers@number@${ids.field502}`,
                alias: "numbers",
                validation: [
                    {
                        name: "required",
                        message: "Number is required."
                    },
                    {
                        name: "gte",
                        message: "Number must be greater or equal 5.",
                        settings: {
                            value: 5
                        }
                    },
                    {
                        name: "lte",
                        message: "Number be less or equal 15.",
                        settings: {
                            value: 15
                        }
                    }
                ],
                listValidation: [
                    {
                        name: "minLength",
                        message: "Numbers must contain at least 2 items.",
                        settings: {
                            value: 2
                        }
                    },
                    {
                        name: "maxLength",
                        message: "Numbers can contain at most 7 items.",
                        settings: {
                            value: 7
                        }
                    }
                ],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // email
            {
                id: ids.field503,
                multipleValues: false,
                helpText: "",
                label: "E-mail",
                type: "text",
                fieldId: `email@text@${ids.field503}`,
                alias: "email",
                validation: [
                    {
                        name: "pattern",
                        message: "Must be in a form of an email.",
                        settings: {
                            preset: "email"
                        }
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // url
            {
                id: ids.field504,
                multipleValues: false,
                helpText: "",
                label: "Url",
                type: "text",
                fieldId: `url@text@${ids.field504}`,
                alias: "url",
                validation: [
                    {
                        name: "pattern",
                        message: "Must be in a form of a url.",
                        settings: {
                            preset: "url"
                        }
                    }
                ],
                listValidation: [],
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
                id: ids.field505,
                multipleValues: false,
                helpText: "",
                label: "LowerCase",
                type: "text",
                fieldId: `lowerCase@text@${ids.field505}`,
                alias: "lowerCase",
                validation: [
                    {
                        name: "pattern",
                        message: "Everything must be lowercase.",
                        settings: {
                            preset: "lowerCase"
                        }
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // upperCase
            {
                id: ids.field506,
                multipleValues: false,
                helpText: "",
                label: "UpperCase",
                type: "text",
                fieldId: `upperCase@text@${ids.field506}`,
                alias: "upperCase",
                validation: [
                    {
                        name: "pattern",
                        message: "Everything must be uppercase.",
                        settings: {
                            preset: "upperCase"
                        }
                    }
                ],
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // date
            {
                id: ids.field507,
                multipleValues: false,
                helpText: "",
                label: "Date",
                type: "datetime",
                fieldId: `date@datetime@${ids.field507}`,
                alias: "date",
                validation: [
                    {
                        name: "dateGte",
                        message: "Date must be greater or equal than 2020-12-01",
                        settings: {
                            value: "2020-12-01",
                            type: "date"
                        }
                    },
                    {
                        name: "dateLte",
                        message: "Date must be lesser or equal than 2020-12-31",
                        settings: {
                            value: "2020-12-31",
                            type: "date"
                        }
                    },
                    {
                        name: "required",
                        message: "Date is required."
                    }
                ],
                settings: {
                    type: "date"
                },
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // dateTime
            {
                id: ids.field508,
                multipleValues: false,
                helpText: "",
                label: "DateTime",
                type: "datetime",
                fieldId: `dateTime@datetime@${ids.field508}`,
                alias: "dateTime",
                validation: [
                    {
                        name: "dateGte",
                        message: "Date must be greater or equal than 2020-12-01 11:30:00",
                        settings: {
                            value: "2020-12-01 11:30:00",
                            type: "dateTimeWithoutTimezone"
                        }
                    },
                    {
                        name: "dateLte",
                        message: "Date must be lesser or equal than 2020-12-31 13:30:00",
                        settings: {
                            value: "2020-12-31 13:30:00",
                            type: "dateTimeWithoutTimezone"
                        }
                    },
                    {
                        name: "required",
                        message: "DateTime is required."
                    }
                ],
                settings: {
                    type: "dateTimeWithoutTimezone"
                },
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // dateTimeZ
            {
                id: ids.field509,
                multipleValues: false,
                helpText: "",
                label: "DateTime",
                type: "datetime",
                fieldId: `dateTimeZ@datetime@${ids.field509}`,
                alias: "dateTimeZ",
                validation: [
                    {
                        name: "dateGte",
                        message: "Date must be greater or equal than 2020-12-01T11:30:00+0100",
                        settings: {
                            value: "2020-12-01T11:30:00+0100",
                            type: "dateTimeWithTimezone"
                        }
                    },
                    {
                        name: "dateLte",
                        message: "Date must be lesser or equal than 2020-12-31T13:30:00+0100",
                        settings: {
                            value: "2020-12-31T13:30:00+0100",
                            type: "dateTimeWithTimezone"
                        }
                    },
                    {
                        name: "required",
                        message: "DateTimeZ is required."
                    }
                ],
                settings: {
                    type: "dateTimeWithTimezone"
                },
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // time
            {
                id: ids.field510,
                multipleValues: false,
                helpText: "",
                label: "Time",
                type: "datetime",
                fieldId: `time@datetime@${ids.field510}`,
                alias: "time",
                validation: [
                    {
                        name: "dateGte",
                        message: "Time must be greater or equal than 11:30:00",
                        settings: {
                            value: "11:30:00",
                            type: "time"
                        }
                    },
                    {
                        name: "dateLte",
                        message: "Time must be lesser or equal than 13:30:00",
                        settings: {
                            value: "13:30:00",
                            type: "time"
                        }
                    },
                    {
                        name: "required",
                        message: "Time is required."
                    }
                ],
                settings: {
                    type: "time"
                },
                listValidation: [],
                placeholderText: "placeholder text",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // boolean
            {
                id: ids.field511,
                multipleValues: false,
                helpText: "",
                label: "Is Something",
                type: "boolean",
                fieldId: `isSomething@boolean@${ids.field511}`,
                alias: "isSomething",
                validation: [],
                settings: {
                    type: "boolean"
                },
                listValidation: [],
                placeholderText: "",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            // number
            {
                id: ids.field512,
                multipleValues: false,
                helpText: "",
                label: "Rating",
                type: "number",
                fieldId: `rating@number@${ids.field512}`,
                alias: "rating",
                validation: [],
                settings: {
                    type: "number"
                },
                listValidation: [],
                placeholderText: "",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field513,
                multipleValues: false,
                helpText: "",
                label: "Description",
                type: "long-text",
                fieldId: `description@long-text@${ids.field513}`,
                alias: "description",
                validation: [],
                settings: {},
                listValidation: [],
                placeholderText: "Description",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field514,
                multipleValues: false,
                helpText: "",
                label: "Slug",
                type: "text",
                fieldId: `slug@text@${ids.field514}`,
                alias: "slug",
                validation: [
                    {
                        name: "unique",
                        message: "Field value must be unique."
                    }
                ],
                settings: {},
                listValidation: [],
                placeholderText: "Slug",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        tenant: "root",
        webinyVersion
    },
    // bug
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "name",
        lockedFields: [],
        name: "Bug",
        description: "Debuggable bugs",
        modelId: "bug",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field601], [ids.field602], [ids.field603], [ids.field604]],
        fields: [
            {
                id: ids.field601,
                multipleValues: false,
                helpText: "",
                label: "Name",
                type: "text",
                fieldId: `name@text@${ids.field601}`,
                alias: "name",
                validation: [],
                listValidation: [],
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
                id: ids.field602,
                multipleValues: false,
                helpText: "",
                label: "Bug type",
                type: "text",
                fieldId: `bugType@text@${ids.field602}`,
                alias: "bugType",
                validation: [],
                listValidation: [],
                placeholderText: "A bug type selectable field",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "Critical bug!",
                            value: "critical"
                        },
                        {
                            label: "Mediocre bug",
                            value: "mediocre"
                        },
                        {
                            label: "When you have time bug",
                            value: "when-you-have-time"
                        }
                    ]
                },
                settings: {
                    defaultValue: "critical"
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field603,
                multipleValues: false,
                helpText: "",
                label: "Bug developer value",
                type: "number",
                fieldId: `bugValue@number@${ids.field603}`,
                alias: "bugValue",
                validation: [],
                listValidation: [],
                placeholderText: "A bug developer value selectable field",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "Low bug value",
                            value: "1"
                        },
                        {
                            label: "Medium bug value",
                            value: "2"
                        },
                        {
                            label: "High bug value",
                            value: "3"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field604,
                multipleValues: false,
                helpText: "",
                label: "Bug fixed?",
                type: "number",
                fieldId: `bugFixed@number@${ids.field604}`,
                alias: "bugFixed",
                validation: [],
                listValidation: [],
                placeholderText: "A bug is fixed",
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "No",
                            value: "1"
                        },
                        {
                            label: "Almost",
                            value: "2"
                        },
                        {
                            label: "Yes!",
                            value: "3"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        tenant: "root",
        webinyVersion
    },
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Article",
        description: "Article with multiple categories",
        modelId: "article",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field701, ids.field702, ids.field703, ids.field704]],
        fields: [
            {
                id: ids.field701,
                multipleValues: false,
                helpText: "",
                label: "Title",
                type: "text",
                fieldId: `title@text@${ids.field701}`,
                alias: "title",
                validation: [],
                listValidation: [],
                placeholderText: "Title",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field702,
                multipleValues: false,
                helpText: "",
                label: "Body",
                type: "rich-text",
                fieldId: `body@rich-text@${ids.field702}`,
                alias: "body",
                validation: [],
                listValidation: [],
                placeholderText: "Body",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field703,
                multipleValues: true,
                helpText: "",
                label: "Categories",
                type: "ref",
                fieldId: `categories@ref@${ids.field703}`,
                alias: "categories",
                validation: [],
                listValidation: [],
                placeholderText: "Categories",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                },
                settings: {
                    models: [{ modelId: "category" }]
                }
            },
            {
                id: ids.field704,
                multipleValues: false,
                helpText: "",
                label: "Category",
                type: "ref",
                fieldId: `category@ref@${ids.field704}`,
                alias: "category",
                validation: [],
                listValidation: [],
                placeholderText: "Category",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                },
                settings: {
                    models: [{ modelId: "category" }]
                }
            }
        ],
        tenant: "root",
        webinyVersion
    }
];

export default models;
