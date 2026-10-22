import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewListReadFilter } from "@webiny/api-workflows/domain/review/types.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

export interface IWbPageReviewReadFilter {
    /**
     * The page review list read filter (Q77) of the current identity. A failed permission or
     * folder permission read is a persistence error (R87).
     */
    build(): Promise<Result<ReviewListReadFilter, ReviewPersistenceError>>;
}

/**
 * What the Website Builder page list would show the current identity, as a review list filter:
 * pages are readable with `canRead("page")`, own-only when `onlyOwnRecords("page")` (as
 * `ListPagesUseCase` filters by `createdBy`); folders come from `WbPageDeniedFolders`, read only
 * when pages have active reviews (`ListReviewedModelsUseCase`).
 */
export const WbPageReviewReadFilter =
    createAbstraction<IWbPageReviewReadFilter>("WbPageReviewReadFilter");

export namespace WbPageReviewReadFilter {
    export type Interface = IWbPageReviewReadFilter;
    export type Return = Promise<Result<ReviewListReadFilter, ReviewPersistenceError>>;
}
