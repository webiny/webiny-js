import { createCmsModelPlugin } from "@webiny/api-headless-cms";

export const createModelPlugin = () => {
    return createCmsModelPlugin({
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "fullName",
        lockedFields: [],
        name: "Author",
        description: "Author",
        modelId: "author",
        singularApiName: "AuthorApiModel",
        pluralApiName: "AuthorsApiModel",
        group: {
            id: "test",
            name: "test"
        },
        layout: [["fullName", "image", "images", "wrapper", "wrappers"]],
        fields: [
            {
                id: "fullName",
                multipleValues: false,
                label: "Full name",
                type: "text",
                fieldId: "fullName"
            },
            {
                id: "image",
                multipleValues: false,
                label: "Image",
                fieldId: "image",
                type: "file"
            },
            {
                id: "images",
                multipleValues: true,
                label: "Image",
                fieldId: "images",
                type: "file"
            },
            {
                id: "wrapper",
                multipleValues: false,
                label: "Wrapper",
                type: "object",
                fieldId: "wrapper",
                settings: {
                    fields: [
                        {
                            id: "image",
                            multipleValues: false,
                            label: "Image",
                            fieldId: "image",
                            type: "file"
                        },
                        {
                            id: "images",
                            multipleValues: true,
                            label: "Images",
                            fieldId: "images",
                            type: "file"
                        }
                    ]
                }
            },
            {
                id: "wrappers",
                multipleValues: true,
                label: "Wrappers",
                type: "object",
                fieldId: "wrappers",
                settings: {
                    fields: [
                        {
                            id: "image",
                            multipleValues: false,
                            label: "Image",
                            fieldId: "image",
                            type: "file"
                        },
                        {
                            id: "images",
                            multipleValues: true,
                            label: "Images",
                            fieldId: "images",
                            type: "file"
                        }
                    ]
                }
            }
        ],
        tenant: "root"
    });
};
