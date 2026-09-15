import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

export const isAssetField = (field: Pick<CmsModelField, "type">): boolean => {
    return field.type === "asset";
};
