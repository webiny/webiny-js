import type { CmsModel } from "~/types.js";

// Models tagged `$hidden:true` are internal and never listed.
export const isListedModel = (model: CmsModel): boolean => {
    return !model.tags?.includes("$hidden:true");
};
