import shortId from "shortid";
import contentModelGroup from "./contentModelGroup";
import { CmsContentModelType } from "@webiny/api-headless-cms/types";

const ids = {
    field11: shortId.generate(),
    field12: shortId.generate(),
    field21: shortId.generate(),
    field22: shortId.generate(),
    field23: shortId.generate(),
    field24: shortId.generate(),
    field25: shortId.generate(),
    field26: shortId.generate(),
    field31: shortId.generate(),
    field32: shortId.generate(),
    field33: shortId.generate()
};

const models: CmsContentModelType[] = [
    {
        createdOn: new Date(),
        savedOn: new Date(),
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
                fieldId: "slug",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
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
            }
        ]
    },
    {
        createdOn: new Date(),
        savedOn: new Date(),
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
            [ids.field21],
            [ids.field22],
            [ids.field23],
            [ids.field24],
            [ids.field25],
            [ids.field26]
        ],
        fields: [
            {
                id: ids.field21,
                multipleValues: false,
                helpText: "",
                label: "Title",
                fieldId: "title",
                type: "text",
                validation: [
                    {
                        name: "required",
                        message: "Please enter a product name"
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
            {
                id: ids.field22,
                multipleValues: false,
                helpText: "",
                label: "Category",
                fieldId: "category",
                type: "ref",
                validation: [
                    {
                        name: "required",
                        message: "Please select a category"
                    }
                ],
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
                id: ids.field23,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: "price",
                type: "number",
                validation: [
                    {
                        name: "required",
                        message: "Please enter a price"
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
            {
                id: ids.field24,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: "inStock",
                type: "boolean",
                validation: [],
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
                id: ids.field25,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: "itemsInStock",
                type: "number",
                validation: [],
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
                id: ids.field26,
                multipleValues: false,
                helpText: "",
                label: "Available on",
                fieldId: "availableOn",
                type: "datetime",
                settings: {
                    type: "date"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please enter a date"
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
            }
        ]
    },
    {
        createdOn: new Date(),
        savedOn: new Date(),
        titleFieldId: "text",
        lockedFields: [],
        name: "Review",
        description: "Product review",
        modelId: "review",
        group: {
            id: contentModelGroup.id,
            name: contentModelGroup.name
        },
        layout: [[ids.field31], [ids.field32], [ids.field33]],
        fields: [
            {
                id: ids.field31,
                multipleValues: false,
                helpText: "",
                label: "Text",
                type: "text",
                fieldId: "text",
                validation: [
                    {
                        name: "required",
                        message: "This field is required"
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
            {
                id: ids.field32,
                multipleValues: false,
                helpText: "",
                label: "Product",
                type: "ref",
                fieldId: "product",
                validation: [],
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
                fieldId: "rating",
                validation: [],
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
];

export default models;
