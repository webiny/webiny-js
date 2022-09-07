import contentModelGroup from "./contentModelGroup";
import { CmsModel } from "~/types";
import { generateAlphaNumericId } from "@webiny/utils";

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
    field11: generateAlphaNumericId(6),
    field12: generateAlphaNumericId(6),
    // product
    field201: generateAlphaNumericId(6),
    field202: generateAlphaNumericId(6),
    field203: generateAlphaNumericId(6),
    field204: generateAlphaNumericId(6),
    field205: generateAlphaNumericId(6),
    field206: generateAlphaNumericId(6),
    field207: generateAlphaNumericId(6),
    field208: generateAlphaNumericId(6),
    field209: generateAlphaNumericId(6),
    field210: generateAlphaNumericId(6),
    field211: generateAlphaNumericId(6),
    field212: generateAlphaNumericId(6),
    field213: generateAlphaNumericId(6),
    field214: generateAlphaNumericId(6),
    field215: generateAlphaNumericId(6),
    field216: generateAlphaNumericId(6),
    field217: generateAlphaNumericId(6),
    field218: generateAlphaNumericId(6),
    field219: generateAlphaNumericId(6),
    field220: generateAlphaNumericId(6),
    // product review
    field31: generateAlphaNumericId(6),
    field32: generateAlphaNumericId(6),
    field33: generateAlphaNumericId(6),
    field34: generateAlphaNumericId(6),
    // author
    field40: generateAlphaNumericId(6),
    // fruit
    field501: generateAlphaNumericId(6),
    field502: generateAlphaNumericId(6),
    field503: generateAlphaNumericId(6),
    field504: generateAlphaNumericId(6),
    field505: generateAlphaNumericId(6),
    field506: generateAlphaNumericId(6),
    field507: generateAlphaNumericId(6),
    field508: generateAlphaNumericId(6),
    field509: generateAlphaNumericId(6),
    field510: generateAlphaNumericId(6),
    field511: generateAlphaNumericId(6),
    field512: generateAlphaNumericId(6),
    field513: generateAlphaNumericId(6),
    field514: generateAlphaNumericId(6),
    // bug
    field601: generateAlphaNumericId(6),
    field602: generateAlphaNumericId(6),
    field603: generateAlphaNumericId(6),
    field604: generateAlphaNumericId(6),
    // article
    field701: generateAlphaNumericId(6),
    field702: generateAlphaNumericId(6),
    field703: generateAlphaNumericId(6),
    field704: generateAlphaNumericId(6)
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
                storageId: "title",
                fieldId: "title",
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
                storageId: "slug",
                fieldId: "slug",
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
                storageId: "title",
                fieldId: "title",
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
                storageId: "category",
                fieldId: "category",
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
                storageId: "price",
                fieldId: "price",
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
                label: "Price",
                storageId: "inStock",
                fieldId: "inStock",
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
                label: "Price",
                storageId: "itemsInStock",
                fieldId: "itemsInStock",
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
                storageId: "availableOn",
                fieldId: "availableOn",
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
                storageId: "color",
                fieldId: "color",
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
                storageId: "availableSizes",
                fieldId: "availableSizes",
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
                storageId: "image",
                fieldId: "image",
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
                storageId: "richText",
                fieldId: "richText",
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
                storageId: "variant",
                fieldId: "variant",
                type: "object",
                settings: {
                    fields: [
                        {
                            id: ids.field212,
                            multipleValues: false,
                            helpText: "",
                            label: "Name",
                            storageId: "name",
                            fieldId: "name",
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
                            storageId: "price",
                            fieldId: "price",
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
                            storageId: "category",
                            fieldId: "category",
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
                            storageId: "options",
                            fieldId: "options",
                            type: "object",
                            settings: {
                                fields: [
                                    {
                                        id: ids.field215,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Name",
                                        storageId: "name",
                                        fieldId: "name",
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
                                        storageId: "price",
                                        fieldId: "price",
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
                                        storageId: "category",
                                        fieldId: "category",
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
                                        storageId: "categories",
                                        fieldId: "categories",
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
                storageId: "fieldsObject",
                fieldId: "fieldsObject",
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
                            storageId: "text",
                            fieldId: "text",
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
                storageId: "text",
                fieldId: "text",
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
                storageId: "product",
                fieldId: "product",
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
                storageId: "rating",
                fieldId: "rating",
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
                storageId: "author",
                fieldId: "author",
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
                storageId: "fullName",
                fieldId: "fullName",
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
                storageId: "name",
                fieldId: "name",
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
                storageId: "numbers",
                fieldId: "numbers",
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
                storageId: "email",
                fieldId: "email",
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
                storageId: "url",
                fieldId: "url",
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
                storageId: "lowerCase",
                fieldId: "lowerCase",
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
                storageId: "upperCase",
                fieldId: "upperCase",
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
                storageId: "date",
                fieldId: "date",
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
                storageId: "dateTime",
                fieldId: "dateTime",
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
                storageId: "dateTimeZ",
                fieldId: "dateTimeZ",
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
                storageId: "time",
                fieldId: "time",
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
                storageId: "isSomething",
                fieldId: "isSomething",
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
                storageId: "rating",
                fieldId: "rating",
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
                storageId: "description",
                fieldId: "description",
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
                storageId: "slug",
                fieldId: "slug",
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
                storageId: "name",
                fieldId: "name",
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
                storageId: "bugType",
                fieldId: "bugType",
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
                storageId: "bugValue",
                fieldId: "bugValue",
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
                storageId: "bugFixed",
                fieldId: "bugFixed",
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
                storageId: "title",
                fieldId: "title",
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
                storageId: "body",
                fieldId: "body",
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
                storageId: "categories",
                fieldId: "categories",
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
                storageId: "category",
                fieldId: "category",
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
