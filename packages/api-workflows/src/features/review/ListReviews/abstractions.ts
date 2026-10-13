import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ReviewData,
    ReviewListKind,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere
} from "~/domain/review/types.js";
import type { ReviewPersistenceError, ReviewValidationError } from "~/domain/review/errors.js";

/** Target read access for one row, from the app wrapper (D76, D133); a throw is "unreadable". */
export type ReviewReadPredicate = (review: ReviewData) => Promise<boolean>;

export interface ListReviewsInput {
    list: ReviewListKind;
    /** The viewer, built by the app wrapper (D132). */
    viewerUserId: string;
    viewerTeamIds: string[];
    /** Namespace ids the app lists (R91, R94); an empty list returns an empty page. */
    models: string[];
    where?: ReviewListWhere | null;
    /** Default `lastChangedOn_DESC` for `myRequests`, `lastChangedOn_ASC` otherwise (D119). */
    sort?: ReviewListSort | null;
    /** Default 20; values above 100 are clamped (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous call; valid only with the same list, where and sort. */
    after?: string | null;
    canRead: ReviewReadPredicate;
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
 * passes the viewer, its namespaces and the target read predicate, and checks `reassign` for the
 * failed steps list (R95). Rows the predicate rejects are skipped; a call examines at most 200
 * rows, so a page can be short while `hasMoreItems` is true (A41).
 */
export const ListReviewsUseCase = createAbstraction<IListReviewsUseCase>("ListReviewsUseCase");

export namespace ListReviewsUseCase {
    export type Interface = IListReviewsUseCase;
    export type Input = ListReviewsInput;
    export type Output = ListReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListReviewsOutput, UseCaseError>>;
}
