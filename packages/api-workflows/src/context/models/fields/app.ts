import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createAppField = (): CmsModelField => {
    return {
        id: "app",
        type: "text",
        storageId: "text@app",
        fieldId: "app",
        label: "App",
        validation: [
            {
                name: "required",
                message: "App is required."
            }
        ]
    };
};
