import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

/** Models with this tag cannot be published, so they cannot be bound (spec 4.1, D41). */
export const UNPUBLISHABLE_MODEL_TAG = "$publishing:false";

/**
 * A model a workflow can be bound to: public and publishable (the rule
 * `DisallowUnpublishableModelsOnBeforeCreate` enforces). Readability comes from
 * `ListModelsUseCase`, which returns only models the identity can read. Pure.
 */
export const isBindableModel = (model: Pick<CmsModel, "isPrivate" | "tags">): boolean => {
    if (model.isPrivate) {
        return false;
    }
    return !(model.tags ?? []).includes(UNPUBLISHABLE_MODEL_TAG);
};
