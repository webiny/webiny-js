import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createTitleField = (): CmsModelField => {
    return {
        id: "title",
        type: "text",
        fieldId: "title",
        storageId: "text@title",
        label: "Title",
        validation: [
            {
                name: "required",
                message: "Title is required."
            }
        ]
    };
};
