import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const CMS_NAMESPACE = "Cms/Entry/";

/**
 * Namespace must be exactly like in the API, or it will not match - scheduling will fail.
 * @param model
 */
export const createNamespace = (model: Pick<CmsModel, "modelId">): string => {
    return `${CMS_NAMESPACE}${model.modelId}`;
};
