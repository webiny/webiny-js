import { createContentModelGroup } from "./contentModelGroup";
import { CmsModel } from "~/types";
import {
    CmsGroupPlugin,
    CmsModelInput,
    CmsModelPlugin,
    createCmsGroupPlugin,
    createCmsModelPlugin
} from "~/plugins";

const { version: webinyVersion } = require("@webiny/cli/package.json");

const contentModelGroup = createContentModelGroup();

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
    field11: "title",
    field12: "slug",
    // product
    field201: "title",
    field202: "category",
    field203: "price",
    field204: "inStock",
    field205: "itemsInStock",
    field206: "availableOn",
    field207: "color",
    field208: "availableSizes",
    field209: "image",
    field210: "richText",
    field211: "variant",
    field212: "variantName",
    field213: "variantPrice",
    field2110: "variantImage",
    field214: "variantOptions",
    field215: "variantOptionsName",
    field2111: "variantOptionsImage",
    field216: "variantOptionsPrice",
    field217: "variantCategory",
    field218: "variantOptionsCategory",
    field219: "variantOptionsCategories",
    field220: "variantOptionsLongText",
    field221: "variantOptionsFieldsObject",
    field231: "variantOptionsFieldsObjectText",
    // product review
    field31: "text",
    field32: "product",
    field33: "rating",
    field34: "author",
    // author
    field40: "fullName",
    // fruit
    field501: "name",
    field502: "numbers",
    field503: "email",
    field504: "url",
    field505: "lowerCase",
    field506: "upperCase",
    field507: "date",
    field508: "dateTime",
    field509: "dateTimeZ",
    field510: "time",
    field511: "isSomething",
    field512: "rating",
    field513: "description",
    field514: "slug",
    // bug
    field601: "name",
    field602: "bugType",
    field603: "bugValue",
    field604: "bugFixed",
    // article
    field701: "title",
    field702: "body",
    field703: "categories",
    field704: "category",
    // wrapper
    field_wrap_1: "title",
    field_wrap_2: "references"
};

const models: CmsModel[] = [
    // Test entry.
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Test Entry",
        description: "This is a test model with test entries.",
        modelId: "testModel",
        singularApiName: "TestEntry",
        pluralApiName: "TestEntries",
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
                storageId: "text@titleStorageId",
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
                storageId: "text@slugStorageId",
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
        singularApiName: "CategoryApiNameWhichIsABitDifferentThanModelId",
        pluralApiName: "CategoriesApiModel",
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
                storageId: "text@titleStorageId",
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
                storageId: "text@slugStorageId",
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
    // category
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Category Singleton",
        description: "Product category Singleton",
        modelId: "categorySingleton",
        singularApiName: "CategoryApiNameWhichIsABitDifferentThanModelIdSingleton",
        pluralApiName: "CategoriesApiModelSingleton",
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
                storageId: "text@titleStorageId",
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
                storageId: "text@slugStorageId",
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
            },
            {
                id: ids.field34,
                multipleValues: false,
                helpText: "",
                label: "Category",
                type: "ref",
                storageId: "ref@categoryRef",
                fieldId: "categoryRef",
                validation: [],
                listValidation: [],
                placeholderText: "placeholder text",
                settings: {
                    models: [
                        {
                            modelId: "categorySingleton"
                        }
                    ]
                },
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
        singularApiName: "ProductApiSingular",
        pluralApiName: "ProductPluralApiName",
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
            [ids.field221]
        ],
        fields: [
            {
                id: ids.field201,
                multipleValues: false,
                helpText: "",
                label: "Title",
                storageId: "text@titleStorageId",
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
                storageId: "ref@categoryStorageId",
                fieldId: "category",
                type: "ref",
                // validation: [
                //     {
                //         name: "required",
                //         message: "Please select a category"
                //     }
                // ],
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
                storageId: "number@priceStorageId",
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
                label: "In Stock",
                storageId: "boolean@inStockStorageId",
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
                storageId: "number@itemsInStockStorageId",
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
                storageId: "datetime@availableOnStorageId",
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
                storageId: "text@colorStorageId",
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
                storageId: "text@availableSizesStorageId",
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
                storageId: "file@imageStorageId",
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
                storageId: "rich-text@richTextStorageId",
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
                storageId: "object@variantStorageId",
                fieldId: "variant",
                type: "object",
                settings: {
                    fields: [
                        {
                            id: ids.field212,
                            multipleValues: false,
                            helpText: "",
                            label: "Name",
                            storageId: "text@nameStorageId",
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
                            storageId: "number@priceStorageId",
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
                            id: ids.field2110,
                            fieldId: "images",
                            storageId: `file@${ids.field2110}`,
                            multipleValues: true,
                            placeholderText: null,
                            helpText: "",
                            label: "Image",
                            type: "file",
                            renderer: {
                                name: "file"
                            }
                        },
                        {
                            id: ids.field217,
                            multipleValues: false,
                            helpText: "",
                            label: "Category",
                            storageId: "ref@categoryStorageId",
                            fieldId: "category",
                            type: "ref",
                            // validation: [
                            //     {
                            //         name: "required",
                            //         message: "Please select a category"
                            //     }
                            // ],
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
                            storageId: "object@optionsStorageId",
                            fieldId: "options",
                            type: "object",
                            settings: {
                                fields: [
                                    {
                                        id: ids.field215,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Name",
                                        storageId: "text@nameStorageId",
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
                                        storageId: "number@priceStorageId",
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
                                        id: ids.field2111,
                                        fieldId: "image",
                                        storageId: `file@${ids.field2111}`,
                                        multipleValues: false,
                                        placeholderText: null,
                                        helpText: "",
                                        label: "Image",
                                        type: "file",
                                        renderer: {
                                            name: "file"
                                        }
                                    },
                                    {
                                        id: ids.field218,
                                        multipleValues: false,
                                        helpText: "",
                                        label: "Category",
                                        storageId: "ref@categoryStorageId",
                                        fieldId: "category",
                                        type: "ref",
                                        // validation: [
                                        //     {
                                        //         name: "required",
                                        //         message: "Please select a category"
                                        //     }
                                        // ],
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
                                        storageId: "ref@categoriesStorageId",
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
                                    },
                                    {
                                        id: ids.field220,
                                        multipleValues: true,
                                        helpText: "",
                                        label: "Long Text List",
                                        storageId: "long-text@longTextStorageId",
                                        fieldId: "longText",
                                        type: "long-text",
                                        validation: [],
                                        listValidation: [],
                                        settings: {},
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
                id: ids.field221,
                multipleValues: false,
                helpText: "",
                label: "No fields object",
                storageId: "object@fieldsObjectStorageId",
                fieldId: "fieldsObject",
                type: "object",
                settings: {
                    layout: [[ids.field231]],
                    fields: [
                        {
                            id: ids.field231,
                            multipleValues: false,
                            helpText: "",
                            label: "Text",
                            type: "text",
                            storageId: "text@textStorageId",
                            fieldId: "text",
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
        singularApiName: "ReviewApiModel",
        pluralApiName: "ReviewsApiModel",
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
                storageId: "text@textStorageId",
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
                storageId: "ref@productStorageId",
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
                storageId: "number@ratingStorageId",
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
                storageId: "ref@authorStorageId",
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
        singularApiName: "AuthorApiModel",
        pluralApiName: "AuthorsApiModel",
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
                storageId: "text@fullNameStorageId",
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
        singularApiName: "FruitApiModel",
        pluralApiName: "FruitsApiModel",
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
                storageId: "text@nameStorageId",
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
                storageId: "number@numbersStorageId",
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
                storageId: "text@emailStorageId",
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
                storageId: "text@urlStorageId",
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
                storageId: "text@lowerCaseStorageId",
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
                storageId: "text@upperCaseStorageId",
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
                storageId: "datetime@dateStorageId",
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
                storageId: "datetime@dateTimeStorageId",
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
                storageId: "datetime@dateTimeZStorageId",
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
                storageId: "datetime@timeStorageId",
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
                storageId: "boolean@isSomethingStorageId",
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
                storageId: "number@ratingStorageId",
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
                storageId: "long-text@descriptionStorageId",
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
                storageId: "text@slugStorageId",
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
        singularApiName: "BugApiModel",
        pluralApiName: "BugsApiModel",
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
                storageId: "text@nameStorageId",
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
                storageId: "text@bugTypeStorageId",
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
                storageId: "number@bugValueStorageId",
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
                storageId: "number@bugFixedStorageId",
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
    // article
    {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Article",
        description: "Article with multiple categories",
        modelId: "article",
        singularApiName: "ArticleApiModel",
        pluralApiName: "ArticlesApiModel",
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
                storageId: "text@titleStorageId",
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
                storageId: "rich-text@bodyStorageId",
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
                storageId: "ref@categoriesStorageId",
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
                storageId: "ref@categoryStorageId",
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
    },
    // Wrap
    /**
     * Used to test the ref field with multiple models.
     */
    {
        name: "Wrap",
        modelId: "wrap",
        singularApiName: "Wrap",
        pluralApiName: "Wraps",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        fields: [
            {
                id: ids.field_wrap_1,
                label: "Title",
                fieldId: "title",
                type: "text",
                storageId: "text@titleStorageId",
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            },
            {
                id: ids.field_wrap_2,
                label: "References",
                fieldId: "references",
                type: "ref",
                storageId: "ref@references",
                multipleValues: true,
                settings: {
                    models: [
                        {
                            modelId: "product"
                        },
                        {
                            modelId: "category"
                        },
                        {
                            modelId: "author"
                        }
                    ]
                },
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "renderer"
                }
            }
        ],
        layout: [],
        tenant: "root",
        locale: "en-US",
        titleFieldId: "title",
        description: "Wrapper model for ref field with multiple models",
        webinyVersion
    }
];

export default models;

export const getCmsModel = (modelId: string) => {
    const model = models.find(m => m.modelId === modelId);
    if (!model) {
        const message = `Model with modelId "${modelId}" not found.`;
        console.log(message);
        throw new Error(message);
    }
    return model;
};

export const createModelPlugins = (targets: string[]) => {
    return [
        createCmsGroupPlugin({
            ...contentModelGroup
        }),
        ...targets.map(modelId => {
            const model = models.find(m => m.modelId === modelId);
            if (!model) {
                throw new Error(`There is no model ${modelId}.`);
            }
            const newModel: CmsModelInput = {
                ...(model as Omit<CmsModel, "isPrivate">),
                noValidate: true
            };
            return createCmsModelPlugin(newModel);
        })
    ];
};

export const createPluginFromCmsModel = (
    model: Omit<CmsModel, "isPrivate">
): (CmsModelPlugin | CmsGroupPlugin)[] => {
    return [
        createCmsGroupPlugin(contentModelGroup),
        createCmsModelPlugin({
            ...model,
            group: {
                id: contentModelGroup.id,
                name: contentModelGroup.name
            },
            noValidate: true
        })
    ];
};
