import { createPrivateModel, createModelField } from "@webiny/api-headless-cms";

const propertiesField = () =>
    createModelField({
        label: "Properties",
        type: "searchable-json"
    });

const bindingsField = () =>
    createModelField({
        label: "Bindings",
        type: "json"
    });

export const elementsField = () =>
    createModelField({
        label: "Elements",
        type: "json"
    });

const extensionsField = () =>
    createModelField({
        label: "Extensions",
        fieldId: "extensions",
        type: "object",
        settings: {
            layout: [],
            fields: []
        }
    });

export const PAGE_MODEL_ID = "wbPage";

export const createPageModel = () => {
    const fields = [propertiesField(), bindingsField(), elementsField(), extensionsField()];

    return createPrivateModel({
        name: "Website Builder - Page",
        modelId: PAGE_MODEL_ID,
        titleFieldId: "properties.title",
        authorization: {
            // Disables base permission checks, but leaves FLP checks enabled.
            permissions: false
        },
        fields
    });
};
