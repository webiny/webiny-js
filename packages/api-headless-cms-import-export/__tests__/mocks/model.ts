import {
    createModelPlugin as createModelPluginBase,
    createModelField
} from "@webiny/api-headless-cms";

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
        createModelField({
            id: "fullName",
            list: false,
            label: "Full name",
            type: "text",
            fieldId: "fullName"
        }),
        createModelField({
            id: "image",
            list: false,
            label: "Image",
            fieldId: "image",
            type: "file"
        }),
        createModelField({
            id: "images",
            list: true,
            label: "Image",
            fieldId: "images",
            type: "file"
        }),
        createModelField({
            id: "wrapper",
            list: false,
            label: "Wrapper",
            type: "object",
            fieldId: "wrapper",
            settings: {
                fields: [
                    createModelField({
                        id: "image",
                        list: false,
                        label: "Image",
                        fieldId: "image",
                        type: "file"
                    }),
                    createModelField({
                        id: "images",
                        list: true,
                        label: "Images",
                        fieldId: "images",
                        type: "file"
                    })
                ]
            }
        }),
        createModelField({
            id: "wrappers",
            list: true,
            label: "Wrappers",
            type: "object",
            fieldId: "wrappers",
            settings: {
                fields: [
                    createModelField({
                        id: "image",
                        list: false,
                        label: "Image",
                        fieldId: "image",
                        type: "file"
                    }),
                    createModelField({
                        id: "images",
                        list: true,
                        label: "Images",
                        fieldId: "images",
                        type: "file"
                    })
                ]
            }
        })
    ],
    tenant: "root"
};

export const createModelPlugin = () => {
    return createModelPluginBase(model);
};
