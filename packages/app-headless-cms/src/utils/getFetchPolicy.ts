import { CmsModel } from "~/types";

/**
 * For `dynamicZone` we don't want to write to cache, due to problems with Union Fragments normalization.
 * This needs to be resolved better, but the overall direction is to move away from Apollo Client all together.
 */
export const getFetchPolicy = (model: CmsModel) => {
    const hasDynamicZone = model.fields.some(field => field.type === "dynamicZone");

    return hasDynamicZone ? "no-cache" : undefined;
};
