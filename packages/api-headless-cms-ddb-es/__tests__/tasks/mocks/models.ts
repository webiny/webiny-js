import { createModelPlugin, createPrivateModelPlugin } from "@webiny/api-headless-cms";

export const createMockModels = () => {
    return [
        createModelPlugin({
            noValidate: true,
            modelId: "car",
            singularApiName: "Car",
            pluralApiName: "Cars",
            group: "mock-group",
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
            group: "mock-group",
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
            group: "mock-group",
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
            group: "mock-group",
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
