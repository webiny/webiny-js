import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewListScope } from "~/domain/review/ReviewListScope.js";
import type {
    ReviewData,
    ReviewListReadFilter,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere
} from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewValidationError } from "~/domain/review/errors.js";

export interface ListReviewsInput {
    scope: ReviewListScope;
    /** The viewer, built by the app wrapper (D132). */
    viewerUserId: string;
    viewerTeamIds: string[];
    /**
     * What the viewer may read (Q77), built once per call by the app wrapper from the viewer's
     * permissions: the namespaces the app lists and the viewer reads (R91, R94), the own-only
     * ones and the denied folders. No readable namespace returns an empty page without a query.
     */
    readFilter: ReviewListReadFilter;
    where?: ReviewListWhere | null;
    /** Default per scope and state (`getDefaultReviewListSort`, D119). */
    sort?: ReviewListSort | null;
    /** Default 20; values above 100 are clamped (R92). */
    limit?: number | null;
    /**
     * `meta.cursor` of the previous call; valid only with the same scope, where and sort. A cursor
     * made with another sort fails with `ReviewValidationError`.
     */
    after?: string | null;
}

export interface ListReviewsOutput {
    items: ReviewData[];
    meta: ReviewListMeta;
}

export interface IListReviewsUseCaseErrors {
    /** An invalid cursor, or one made with another sort. */
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListReviewsUseCaseErrors[keyof IListReviewsUseCaseErrors];

export interface IListReviewsUseCase {
    execute(input: ListReviewsInput): Promise<Result<ListReviewsOutput, UseCaseError>>;
}

/**
 * One page of a review list (spec 11, D47, D76, R91, R92). Internal (D132): the app wrapper
 * passes the viewer and its read filter, and checks `reassign` for the `all` scope (R95).
 * Read access is part of the query (Q77); each storage page is confirmed with one batch read
 * (Q78). Rows the confirm drops are skipped; a call examines at most 200 rows, so a page can be
 * short while `hasMoreItems` is true (A41). A scope and state pair that is empty by definition
 * (`isEmptyReviewListFilter`) returns an empty page without a query.
 */
export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>("ListReviewsUseCase");

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Input = ListReviewsInput;
    export type Output = ListReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListReviewsOutput, UseCaseError>>;
}
