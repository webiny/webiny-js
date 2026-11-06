import type { CmsModel } from "~/types/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";

/**
 * A singleton model has exactly one entry, shared by everyone who can access the model.
 * Entry-level (owner) checks do not apply to it.
 */
export const isSingletonModel = (model: Pick<CmsModel, "tags">): boolean => {
    return !!model.tags?.includes(CMS_MODEL_SINGLETON_TAG);
};
