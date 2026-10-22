import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ReviewData,
    ReviewListKind,
    ReviewListReadFilter,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere
} from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewValidationError } from "~/domain/review/errors.js";

export interface ListReviewsInput {
    list: ReviewListKind;
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
    /** Default `lastChangedOn_DESC` for `myRequests`, `lastChangedOn_ASC` otherwise (D119). */
    sort?: ReviewListSort | null;
    /** Default 20; values above 100 are clamped (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous call; valid only with the same list, where and sort. */
    after?: string | null;
}

export interface ListReviewsOutput {
    items: ReviewData[];
    meta: ReviewListMeta;
}

export interface IListReviewsUseCaseErrors {
    /** State filters outside `myRequests`, or an invalid cursor. */
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListReviewsUseCaseErrors[keyof IListReviewsUseCaseErrors];

export interface IListReviewsUseCase {
    execute(input: ListReviewsInput): Promise<Result<ListReviewsOutput, UseCaseError>>;
}

/**
 * One page of a review list (spec 11, D47, D76, R91, R92). Internal (D132): the app wrapper
 * passes the viewer and its read filter, and checks `reassign` for the failed steps list (R95).
 * Read access is part of the query (Q77); each storage page is confirmed with one batch read
 * (Q78). Rows the confirm drops are skipped; a call examines at most 200 rows, so a page can be
 * short while `hasMoreItems` is true (A41).
 */
export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>("ListReviewsUseCase");

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Input = ListReviewsInput;
    export type Output = ListReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListReviewsOutput, UseCaseError>>;
}
