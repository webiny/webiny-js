import type { TestCmsModel } from "../../types";
import type { CmsGroup } from "~/types";
import { createModelField } from "~/utils/createModelField.js";

export const createProductModel = (group: CmsGroup): TestCmsModel => {
    return {
        modelId: "product",
        singularApiName: "Product",
        pluralApiName: "Products",
        group: group.slug,
        name: "Product",
        description: "Products for our e-commerce store",
        titleFieldId: "name",
        icon: { type: "fas", name: "shopping-cart" },
        fields: [
            createModelField({
                id: "name",
                storageId: "text@name",
                fieldId: "name",
                type: "text",
                label: "Name",
                validation: [
                    {
                        name: "required",
                        message: "Name is required"
                    }
                ],
                settings: {}
            }),
            createModelField({
                id: "sku",
                storageId: "text@sku",
                fieldId: "sku",
                type: "text",
                label: "SKU",
                validation: [
                    {
                        name: "required",
                        message: "SKU is required"
                    }
                ],
                settings: {
                    unique: true
                }
            }),
            createModelField({
                id: "description",
                storageId: "long-text@description",
                fieldId: "description",
                type: "long-text",
                label: "Description",
                validation: [],
                settings: {}
            }),
            createModelField({
                id: "price",
                storageId: "number@price",
                fieldId: "price",
                type: "number",
                label: "Price",
                validation: [
                    {
                        name: "required",
                        message: "Price is required"
                    },
                    {
                        name: "gte",
                        message: "Price must be greater than or equal to 0",
                        settings: {
                            value: 0
                        }
                    }
                ],
                settings: {}
            }),
            createModelField({
                id: "category",
                storageId: "ref@category",
                fieldId: "category",
                type: "ref",
                label: "Category",
                validation: [],
                settings: {
                    models: [{ modelId: "productCategory" }]
                }
            })
        ],
        layout: [["name"], ["sku"], ["category"], ["description"], ["price"]]
    };
};
