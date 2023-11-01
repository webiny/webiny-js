import { CmsModel } from "~/types";

/**
 * Given a model, return an array of tags ensuring the `type` tag is set.
 */
export const ensureTypeTag = (model: Pick<CmsModel, "tags">) => {
    // Let's make sure we have a `type` tag assigned.
    // If `type` tag is not set, set it to a default one (`model`).
    const tags = model.tags || [];
    if (!tags.some(tag => tag.startsWith("type:"))) {
        tags.push("type:model");
    }

    return tags;
};
