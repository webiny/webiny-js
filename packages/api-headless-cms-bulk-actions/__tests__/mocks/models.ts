import { type CmsGroup, createModelField } from "@webiny/api-headless-cms";
import {
    createCmsGroupPlugin,
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
        createCmsGroupPlugin(group),
        createModelPlugin({
            noValidate: true,
            modelId: "car",
            singularApiName: "Car",
            pluralApiName: "Cars",
            group: group,
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
            group: group,
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
