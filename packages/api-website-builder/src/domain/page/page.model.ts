import { createModelField, createPrivateModelPlugin } from "@webiny/api-headless-cms";

export const PAGE_MODEL_ID = "wbPage";

export const createPageModel = () => {
    return createPrivateModelPlugin({
        name: "Website Builder - Page",
        modelId: PAGE_MODEL_ID,
        titleFieldId: "properties.title",
        authorization: {
            // Disables base permission checks, but leaves FLP checks enabled.
            permissions: false
        },
        fields: [
            createModelField({
                label: "Properties",
                type: "searchable-json"
            }),
            createModelField({
                label: "Metadata",
                type: "searchable-json"
            }),
            createModelField({
                label: "Bindings",
                type: "json"
            }),
            createModelField({
                label: "Elements",
                type: "json"
            }),
            createModelField({
                label: "Extensions",
                fieldId: "extensions",
                type: "searchable-json"
            })
        ]
    });
};
