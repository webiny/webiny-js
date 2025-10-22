import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createColorField = (): CmsModelField => {
    return {
        id: "color",
        type: "text",
        fieldId: "color",
        storageId: "text@color",
        label: "Color",
        validation: [
            {
                name: "required",
                message: "Color is required."
            }
        ]
    };
}
