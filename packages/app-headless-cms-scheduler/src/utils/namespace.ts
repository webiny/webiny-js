import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const createNamespace = (model: Pick<CmsModel, "modelId">): string => {
    return `cms:${model.modelId}`;
};
