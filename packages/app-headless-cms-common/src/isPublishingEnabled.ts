import type { CmsModel } from "~/types/model.js";
import {
    CMS_MODEL_PUBLISHING_DISABLED_TAG,
    CMS_MODEL_PUBLISHING_ENABLED_TAG
} from "~/constants.js";
import { isSingletonModel } from "./isSingletonModel.js";

/**
 * Regular models publish unless tagged `$publishing:false`.
 * Singleton models publish only when tagged `$publishing:true`.
 */
export const isPublishingEnabled = (model: Pick<CmsModel, "tags">): boolean => {
    const tags = model.tags ?? [];
    if (isSingletonModel(model)) {
        return tags.includes(CMS_MODEL_PUBLISHING_ENABLED_TAG);
    }
    return !tags.includes(CMS_MODEL_PUBLISHING_DISABLED_TAG);
};
