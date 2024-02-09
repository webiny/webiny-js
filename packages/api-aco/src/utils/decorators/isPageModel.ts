import { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * Keep this until we figure out how to fetch the folders.
 */
export const isPageModel = (model: CmsModel): boolean => {
    if (model.modelId === "pbPage") {
        return true;
    } else if (model.modelId === "acoSearchRecord-pbpage") {
        return true;
    }
    return false;
};
