import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewListReadFilter } from "@webiny/api-workflows/domain/review/types.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

export interface ICmsEntryReviewReadFilter {
    /**
     * The review list read filter (Q77) of the current identity over these models. A failed group
     * or folder permission read is a persistence error (R87).
     */
    build(models: CmsModel[]): Promise<Result<ReviewListReadFilter, ReviewPersistenceError>>;
}

/**
 * What the CMS entry list would show the current identity, as a review list filter: a model is
 * readable with group read, model read and entry read (`CmsEntryAccess`); an own-only entry
 * permission makes it own-only, as `ListEntriesUseCase` filters by `createdBy`; folders come from
 * `CmsEntryDeniedFolders`, only for readable models with active reviews
 * (`ListReviewedModelsUseCase`). Evaluated once per call, in memory over the cached
 * permissions.
 */
export const CmsEntryReviewReadFilter = createAbstraction<ICmsEntryReviewReadFilter>(
    "CmsEntryReviewReadFilter"
);

export namespace CmsEntryReviewReadFilter {
    export type Interface = ICmsEntryReviewReadFilter;
    export type Return = Promise<Result<ReviewListReadFilter, ReviewPersistenceError>>;
}
