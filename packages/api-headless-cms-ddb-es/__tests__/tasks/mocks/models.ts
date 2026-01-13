import type { CmsGroup } from "@webiny/api-headless-cms";
import {
    createCmsGroup,
    createModelPlugin,
    createPrivateModelPlugin
} from "@webiny/api-headless-cms";

export const createMockModels = () => {
    const group: CmsGroup = {
        id: "mockGroup",
        name: "Mock Group",
        icon: "fas/star",
        slug: "mock-group",
        description: "Mock Group Description"
    };
    return [
        createCmsGroup(group),
        createModelPlugin({
            noValidate: true,
            modelId: "car",
            singularApiName: "Car",
            pluralApiName: "Cars",
            group: group,
            name: "Car",
            description: "Car model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        }),
        createModelPlugin({
            noValidate: true,
            modelId: "author",
            singularApiName: "Author",
            pluralApiName: "Authors",
            group: group,
            name: "Author",
            description: "Author model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        }),
        createModelPlugin({
            noValidate: true,
            modelId: "book",
            singularApiName: "Book",
            pluralApiName: "Books",
            group: group,
            name: "Book",
            description: "Book model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        }),
        createModelPlugin({
            noValidate: true,
            modelId: "category",
            singularApiName: "Category",
            pluralApiName: "Categories",
            group: group,
            name: "Category",
            description: "Category model",
            fields: [],
            layout: [],
            titleFieldId: "title"
        }),
        createPrivateModelPlugin({
            modelId: "tag",
            name: "Tag",
            fields: [],
            titleFieldId: "title"
        })
    ];
};
