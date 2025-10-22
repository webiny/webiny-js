import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createDescriptionField = (): CmsModelField => {
    return {
        id: "description",
        type: "text",
        fieldId: "description",
        storageId: "text@description",
        label: "Description"
    };
}
