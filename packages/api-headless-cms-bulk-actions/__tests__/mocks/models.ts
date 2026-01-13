import { createModelField } from "@webiny/api-headless-cms";
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
            fields: [
                createModelField({
                    id: "title",
                    fieldId: "title",
                    storageId: "text@title",
                    type: "text",
                    label: "Title"
                })
            ],
            layout: [["title"]],
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
            fields: [
                createModelField({
                    id: "title",
                    fieldId: "title",
                    storageId: "text@title",
                    type: "text",
                    label: "Title"
                })
            ],
            layout: [["title"]],
            titleFieldId: "title"
        })
    ];
};

export const createPrivateMockModels = () => {
    return [
        createPrivateModelPlugin({
            modelId: "private-model",
            name: "Private Model",
            fields: [
                createModelField({
                    id: "title",
                    fieldId: "title",
                    storageId: "text@title",
                    type: "text",
                    label: "Title"
                })
            ],
            titleFieldId: "title"
        })
    ];
};
