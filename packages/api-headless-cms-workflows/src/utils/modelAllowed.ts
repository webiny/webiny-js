import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";

export const isModelAllowed = (model: Pick<CmsModel, "isPrivate" | "tags">): boolean => {
    if (model.isPrivate) {
        return false;
    }
    // TODO remove when we allow singleton models to have workflows.
    else if (model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
        return false;
    }
    return true;
};
