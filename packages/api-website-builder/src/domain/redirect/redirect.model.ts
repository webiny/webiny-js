import { createModelField, createPrivateModelPlugin } from "@webiny/api-headless-cms";

export const REDIRECT_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS
    ? "wbRedirect"
    : "wbyWbRedirect";

export const createRedirectModel = () => {
    return createPrivateModelPlugin({
        name: "Website Builder - Redirect",
        modelId: REDIRECT_MODEL_ID,
        titleFieldId: "from",
        authorization: {
            // Disables base permission checks, but leaves FLP checks enabled.
            permissions: false
        },
        fields: [
            createModelField({
                fieldId: "redirectFrom",
                label: "Redirect From",
                type: "text"
            }),
            createModelField({
                fieldId: "redirectTo",
                label: "Redirect To",
                type: "text"
            }),
            createModelField({
                fieldId: "redirectType",
                label: "Redirect Type",
                type: "text"
            }),
            createModelField({
                fieldId: "isEnabled",
                label: "Is enabled?",
                type: "boolean"
            })
        ]
    });
};
