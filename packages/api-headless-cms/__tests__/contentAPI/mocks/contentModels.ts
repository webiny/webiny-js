import shortId from "shortid";
import contentModelGroup from "./contentModelGroup";
import { CmsContentModelType } from "@webiny/api-headless-cms/types";

const models: CmsContentModelType[] = [
    {
        id: "1",
        createdOn: new Date(),
        environment: "production",
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        description: "Product category",
        modelId: "category",
        group: contentModelGroup.id,
        fields: [
            {
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
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
        environment: "production",
        titleFieldId: "title",
        lockedFields: [],
        name: "Product",
        modelId: "product",
        description: "Products being sold in our webshop",
        group: contentModelGroup.id,
        fields: [
            {
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
                label: "Price",
                fieldId: "inStock",
                type: "boolean",
                validation: []
            },
            {
                _id: shortId.generate(),
                multipleValues: false,
                label: "Price",
                fieldId: "itemsInStock",
                type: "number",
                validation: []
            },
            {
                _id: shortId.generate(),
                multipleValues: false,
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
        environment: "production",
        titleFieldId: "text",
        lockedFields: [],
        name: "Review",
        description: "Product review",
        modelId: "review",
        group: contentModelGroup.id,
        fields: [
            {
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
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
                _id: shortId.generate(),
                multipleValues: false,
                label: "Rating",
                type: "number",
                fieldId: "rating",
                validation: []
            }
        ]
    }
];

export default models;
