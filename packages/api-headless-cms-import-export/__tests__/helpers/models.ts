import {
    CmsGroup,
    CmsModelInput,
    createCmsGroupPlugin,
    createCmsModelPlugin
} from "@webiny/api-headless-cms";

export const group: CmsGroup = {
    id: "5e7c96c46adcbe0007268295",
    name: "A sample content model group",
    slug: "a-sample-content-model-group",
    description: "This is a simple content model group example.",
    icon: "fas/star"
};

export const categoryModel: CmsModelInput = {
    titleFieldId: "title",
    name: "Category",
    description: "Product category",
    modelId: "category",
    singularApiName: "CategoryApiNameWhichIsABitDifferentThanModelId",
    pluralApiName: "CategoriesApiModel",
    group: {
        id: group.id,
        name: group.name
    },
    layout: [["titleFieldIdAbcdef"], ["slugFieldIdAbc"], ["parentCategory"], ["tags"]],
    fields: [
        {
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
        },
        {
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
        },
        {
            id: "parentCategory",
            multipleValues: false,
            helpText: "",
            label: "Self - reference",
            type: "ref",
            fieldId: "parent",
            settings: {
                models: [
                    {
                        modelId: "category",
                        name: "Category"
                    }
                ]
            }
        },
        {
            id: "tags",
            multipleValues: true,
            helpText: "",
            label: "Tags",
            type: "text",
            fieldId: "tags"
        }
    ]
};
export const models: CmsModelInput[] = [categoryModel];

export const createCmsPlugins = () => {
    return [
        createCmsGroupPlugin(group),
        ...models.map(model => {
            return createCmsModelPlugin(model);
        })
    ];
};
