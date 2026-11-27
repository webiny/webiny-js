import type { CmsModel } from "~/types/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";

export const isSingletonModel = (model: Pick<CmsModel, "tags">): boolean => {
    return !!model.tags?.includes(CMS_MODEL_SINGLETON_TAG);
};
