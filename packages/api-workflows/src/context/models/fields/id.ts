import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createIdField = (): CmsModelField => {
    return {
        id: "id",
        type: "text",
        fieldId: "id",
        storageId: "text@id",
        label: "Id",
        validation: [
            {
                name: "required",
                message: "Id is required."
            }
        ]
    };
};
