import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import {
    CMS_MODEL_PUBLISHING_DISABLED_TAG,
    isSingletonModel
} from "@webiny/api-headless-cms/exports/api/cms/model.js";

/**
 * A model a workflow can be bound to: public, not a singleton, and publishable (the rule
 * `DisallowUnpublishableModelsOnBeforeCreate` enforces). Readability comes from
 * `ListModelsUseCase`, which returns only models the identity can read. Pure.
 */
export const isBindableModel = (model: Pick<CmsModel, "isPrivate" | "tags">): boolean => {
    if (model.isPrivate || isSingletonModel(model)) {
        return false;
    }
    return !(model.tags ?? []).includes(CMS_MODEL_PUBLISHING_DISABLED_TAG);
};
