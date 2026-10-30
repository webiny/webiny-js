import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";

/** At most this many blocking reviews are listed to the caller (D115). */
export const MAX_BLOCKING_REVIEWS = 5;

/** At most this many blocking reviews are checked for readability (R76). */
export const MAX_BLOCKING_REVIEW_CHECKS = 50;

/**
 * The app's read check for a set of blocking reviews' targets, as the caller: the reviews whose
 * target the caller can read. One call for the whole set, so the app reads the targets in a batch.
 */
export type BlockingReviewsReadCheck = (
    reviews: WorkflowBlockingReview[]
) => Promise<WorkflowBlockingReview[]>;

export interface IReadableBlockingReviewsService {
    filter(
        reviews: WorkflowBlockingReview[],
        filterReadable: BlockingReviewsReadCheck
    ): Promise<WorkflowBlockingReview[]>;
}

/**
 * The first blocking reviews the caller can read, at most `MAX_BLOCKING_REVIEWS`, for the
 * delete-blocked error (D115, R57). Checks at most `MAX_BLOCKING_REVIEW_CHECKS` in the engine's
 * order with one read check, so a workflow with many unreadable reviews costs a bounded number of
 * reads; a check that throws counts every review as unreadable. The caller keeps the exact count.
 */
export const ReadableBlockingReviewsService = createAbstraction<IReadableBlockingReviewsService>(
    "ReadableBlockingReviewsService"
);

export namespace ReadableBlockingReviewsService {
    export type Interface = IReadableBlockingReviewsService;
    export type ReadCheck = BlockingReviewsReadCheck;
    export type Reviews = WorkflowBlockingReview[];
    export type Return = Promise<WorkflowBlockingReview[]>;
}
