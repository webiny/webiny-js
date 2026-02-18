import type { TestCmsModel } from "../../types";
import type { CmsGroup } from "~/types";
import { createModelField } from "~/utils/createModelField.js";

export const createProductCategoryModel = (group: CmsGroup): TestCmsModel => {
    return {
        modelId: "productCategory",
        singularApiName: "ProductCategory",
        pluralApiName: "ProductCategories",
        group: group.slug,
        name: "Product Category",
        description: "Product categories for organizing products",
        titleFieldId: "name",
        icon: { type: "fas", name: "box" },
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
                    },
                    {
                        name: "minLength",
                        message: "Name must be at least 2 characters",
                        settings: {
                            value: 2
                        }
                    },
                    {
                        name: "maxLength",
                        message: "Name must be at most 100 characters",
                        settings: {
                            value: 100
                        }
                    }
                ],
                settings: {}
            }),
            createModelField({
                id: "slug",
                storageId: "text@slug",
                fieldId: "slug",
                type: "text",
                label: "Slug",
                validation: [
                    {
                        name: "required",
                        message: "Slug is required"
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
                validation: [
                    {
                        name: "minLength",
                        message: "Description must be at least 10 characters",
                        settings: {
                            value: 10
                        }
                    }
                ],
                settings: {}
            })
        ],
        layout: [["name", "slug"], ["description"]]
    };
};
