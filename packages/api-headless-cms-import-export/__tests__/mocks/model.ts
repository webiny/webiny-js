import { createCmsModelPlugin } from "@webiny/api-headless-cms";

export const AUTHOR_MODEL_ID = "author";

export const getModel = (id: string) => {
    if (id === AUTHOR_MODEL_ID) {
        return model;
    }
    throw new Error(`Cannot get model "${id}"!`);
};

export const model = {
    createdOn: new Date().toISOString(),
    savedOn: new Date().toISOString(),
    locale: "en-US",
    titleFieldId: "fullName",
    lockedFields: [],
    name: "Author",
    description: "Author",
    modelId: AUTHOR_MODEL_ID,
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
};

export const createModelPlugin = () => {
    return createCmsModelPlugin(model);
};
