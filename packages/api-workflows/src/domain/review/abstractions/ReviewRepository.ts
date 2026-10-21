import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewListSort, ReviewState, StepState } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";

export interface ReviewRepositoryActiveByTargetParams {
    model: string;
    targetRevisionId: string;
}

export interface ReviewRepositoryByTargetParams {
    model: string;
    targetId: string;
    /** Only the reviews of this revision; every revision when omitted. */
    targetRevisionId?: string;
}

/**
 * Storage pre-filter of the review lists (R91). Keys combine with AND; omitted keys do not
 * restrict. `ListReviewsUseCase` checks every condition again in code on the primary row (R18).
 */
export interface ReviewRepositoryListWhere {
    /** Namespace ids; an empty list matches nothing and is answered without a query. */
    model_in: string[];
    isActive?: boolean;
    state?: ReviewState;
    currentStepState?: StepState;
    currentOwnerId?: string;
    currentOwnerId_not?: string;
    /** Any shared team; an empty list matches nothing and is answered without a query. */
    currentCandidateTeamIds_in?: string[];
    currentStepType_in?: string[];
    /** The requester's id (stored as `requester.id`). */
    requesterId?: string;
    requesterId_not?: string;
    title_contains?: string;
    /** Changed at or after this time (ISO); where an ascending list cursor resumes. */
    lastChangedOn_gte?: string;
    /** Changed at or before this time (ISO); where a descending list cursor resumes. */
    lastChangedOn_lte?: string;
    /** Review ids to leave out; the rows a list cursor already examined at its time. */
    id_not_in?: string[];
}

export interface ReviewRepositoryListParams {
    where: ReviewRepositoryListWhere;
    sort: ReviewListSort;
    limit: number;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ReviewRepositoryListResult {
    items: ReviewData[];
    meta: CmsEntryMeta;
}

export interface IReviewRepository {
    get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>;
    /** At most one active review per target revision (D23). */
    getActiveByTarget(
        params: ReviewRepositoryActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>>;
    countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>;
    /** Every in-progress review of a workflow, confirmed from primary storage (R18). */
    listInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<ReviewData[], ReviewPersistenceError>>;
    /**
     * Active reviews whose current step is in review, owned by any of these users, in every
     * namespace (least-loaded load, R115). Index rows, not confirmed from primary storage: a
     * stale row only shifts a load count (A46). An empty list returns no reviews.
     */
    listInReviewByOwners(ownerIds: string[]): Promise<Result<ReviewData[], ReviewPersistenceError>>;
    /** Every review of a target (active or not), confirmed from primary storage (R18). */
    listByTarget(
        params: ReviewRepositoryByTargetParams
    ): Promise<Result<ReviewData[], ReviewPersistenceError>>;
    /**
     * One page of reviews as the list index has them, in `sort` order. Not confirmed from primary
     * storage: on ddb-os a row can be stale, so callers confirm each row with `get` (R18).
     */
    list(
        params: ReviewRepositoryListParams
    ): Promise<Result<ReviewRepositoryListResult, ReviewPersistenceError>>;
    /** Stores a new review. Only `ReviewSaver` (the single save path) calls this. */
    create(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>;
    /**
     * Stores a change to an existing review. A review deleted since it was read fails with
     * `ReviewNotFoundError` and is never created again. Only `ReviewSaver` calls this.
     */
    update(
        review: ReviewData
    ): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>;
    /** Permanently deletes a review; a missing review counts as deleted. */
    delete(id: string): Promise<Result<void, ReviewPersistenceError>>;
}

/** Reads and writes reviews (entries of the private `wbyWorkflowReview` model, revision 1). */
export const ReviewRepository = createAbstraction<IReviewRepository>("ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
    export type ActiveByTargetParams = ReviewRepositoryActiveByTargetParams;
    export type ByTargetParams = ReviewRepositoryByTargetParams;
    export type ListWhere = ReviewRepositoryListWhere;
    export type ListParams = ReviewRepositoryListParams;
    export type ListResult = ReviewRepositoryListResult;
}
