import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";

export interface ReviewRepositoryActiveByTargetParams {
    model: string;
    targetRevisionId: string;
}

export interface IReviewRepository {
    get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>;
    /** At most one active review per target revision (D23). */
    getActiveByTarget(
        params: ReviewRepositoryActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>>;
    countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>;
    /** Create or update. Only `ReviewSaver` (the single save path) calls this. */
    save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>;
}

/** Reads and writes reviews (entries of the private `wbyWorkflowReview` model, revision 1). */
export const ReviewRepository = createAbstraction<IReviewRepository>("ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
    export type ActiveByTargetParams = ReviewRepositoryActiveByTargetParams;
}
