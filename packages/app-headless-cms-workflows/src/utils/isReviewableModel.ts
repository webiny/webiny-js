import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

/*
 * Singleton models have one entry that is edited in place and are never bound to a workflow (the
 * old editor skipped them the same way).
 */
export function isReviewableModel(model: Pick<CmsModel, "tags">): boolean {
    return !model.tags.includes(CMS_MODEL_SINGLETON_TAG);
}
