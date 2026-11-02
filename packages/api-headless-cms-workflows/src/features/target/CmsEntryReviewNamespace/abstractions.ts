import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryReviewNamespace {
    /**
     * The review namespace of this model's entries (e.g. "cms.article", "wb.page"), or `null`
     * when this implementation does not own the model.
     */
    resolve(model: CmsModel): string | null;
}

/**
 * Maps a CMS model to the review namespace of its entries, for the single CMS entry handlers that
 * also cover apps built on CMS entries (D59, R51). Resolved `multiple`; the last registered
 * non-null answer wins. A model with no namespace is skipped by every handler.
 */
export const CmsEntryReviewNamespace =
    createAbstraction<ICmsEntryReviewNamespace>("CmsEntryReviewNamespace");

export namespace CmsEntryReviewNamespace {
    export type Interface = ICmsEntryReviewNamespace;
}
