import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export const CMS_NAMESPACE = "Cms/Entry/";

export const createNamespace = (model: Pick<CmsModel, "modelId">) => {
    return `${CMS_NAMESPACE}${model.modelId}`;
};

export const extractModelIdFromNamespace = (namespace: string): string | null => {
    if (!namespace.startsWith(CMS_NAMESPACE)) {
        return null;
    }
    return namespace.substring(CMS_NAMESPACE.length) || null;
};
