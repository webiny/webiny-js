import type { CmsModelInput } from "@webiny/api-headless-cms";
import { createModelPlugin, createModelField } from "@webiny/api-headless-cms";

export const categoryModel: CmsModelInput = {
    titleFieldId: "title",
    name: "Category",
    description: "Product category",
    modelId: "category",
    singularApiName: "CategoryApiNameWhichIsABitDifferentThanModelId",
    pluralApiName: "CategoriesApiModel",
    group: "a-sample-content-model-group",
    layout: [["titleFieldIdAbcdef"], ["slugFieldIdAbc"], ["parentCategory"], ["tags"]],
    fields: [
        createModelField({
            id: "titleFieldIdAbcdef",
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
        }),
        createModelField({
            id: "slugFieldIdAbc",
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
        }),
        createModelField({
            id: "parentCategory",
            multipleValues: false,
            helpText: "",
            label: "Self - reference",
            type: "ref",
            fieldId: "parent",
            settings: {
                models: [
                    {
                        modelId: "category"
                    }
                ]
            }
        }),
        createModelField({
            id: "tags",
            multipleValues: true,
            helpText: "",
            label: "Tags",
            type: "text",
            fieldId: "tags"
        })
    ]
};
export const models: CmsModelInput[] = [categoryModel];

export const createCmsPlugins = () => {
    return [
        ...models.map(model => {
            return createModelPlugin(model);
        })
    ];
};
