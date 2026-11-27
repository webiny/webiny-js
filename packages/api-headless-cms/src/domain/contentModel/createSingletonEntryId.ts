import { createCacheKey } from "@webiny/utils";
import type { CmsModel } from "~/types/index.js";

export const createSingletonEntryId = (model: Pick<CmsModel, "modelId">): string => {
    return createCacheKey(model.modelId);
};
