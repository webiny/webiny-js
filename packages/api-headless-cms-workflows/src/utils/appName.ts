import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

const CMS_NAMESPACE = /^cms\.([a-zA-Z0-9_-]+)$/;

/** The review namespace of a CMS model id, e.g. "cms.article" (D15). */
export const toCmsNamespace = (modelId: string): string => {
    return `cms.${modelId}`;
};

/** The model id of a `cms.<modelId>` namespace; `null` for any other namespace. */
export const getModelIdFromAppName = (app: string): string | null => {
    const matched = app.match(CMS_NAMESPACE);
    return matched ? matched[1] : null;
};

export const isCmsNamespace = (app: string): boolean => {
    return getModelIdFromAppName(app) !== null;
};

/**
 * The review namespace of a CMS model's entries: `cms.<modelId>` for public models, `null` for
 * private ones (Website Builder pages, the workflows' own models), R51, R52.
 */
export const getCmsNamespace = (model: Pick<CmsModel, "modelId" | "isPrivate">): string | null => {
    return model.isPrivate ? null : toCmsNamespace(model.modelId);
};
