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
        id: "1",
        createdOn: new Date(),
        savedOn: new Date(),
        environment: "production",
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        description: "Product category",
        modelId: "category",
        group: contentModelGroup.id,
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
                ]
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
                ]
            }
        ]
    },
    {
        id: "2",
        createdOn: new Date(),
        savedOn: new Date(),
        environment: "production",
        titleFieldId: "title",
        lockedFields: [],
        name: "Product",
        modelId: "product",
        description: "Products being sold in our webshop",
        group: contentModelGroup.id,
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
                ]
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
                    type: "one",
                    modelId: "category"
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
                ]
            },
            {
                id: ids.field24,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: "inStock",
                type: "boolean",
                validation: []
            },
            {
                id: ids.field25,
                multipleValues: false,
                helpText: "",
                label: "Price",
                fieldId: "itemsInStock",
                type: "number",
                validation: []
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
                ]
            }
        ]
    },
    {
        id: "3",
        createdOn: new Date(),
        savedOn: new Date(),
        environment: "production",
        titleFieldId: "text",
        lockedFields: [],
        name: "Review",
        description: "Product review",
        modelId: "review",
        group: contentModelGroup.id,
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
                ]
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
                    type: "one",
                    modelId: "product"
                }
            },
            {
                id: ids.field33,
                multipleValues: false,
                helpText: "",
                label: "Rating",
                type: "number",
                fieldId: "rating",
                validation: []
            }
        ]
    }
];

export default models;
