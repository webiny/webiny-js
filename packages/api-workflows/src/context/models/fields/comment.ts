import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export const createCommentField = (): CmsModelField => {
    return {
        fieldId: "comment",
        id: "comment",
        storageId: "text@comment",
        type: "text",
        label: "Comment"
    };
}
