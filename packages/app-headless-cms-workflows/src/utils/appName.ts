import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const createAppName = (model: Pick<CmsModel, "modelId">): string => {
    return `cms.${model.modelId}`;
};
