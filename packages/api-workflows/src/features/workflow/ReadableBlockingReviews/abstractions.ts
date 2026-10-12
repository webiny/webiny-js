import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";

/** At most this many blocking reviews are listed to the caller (D115). */
export const MAX_BLOCKING_REVIEWS = 5;

/** At most this many blocking reviews are checked for readability (R76). */
export const MAX_BLOCKING_REVIEW_CHECKS = 50;

/** The app's read check for one blocking review's target, as the caller. */
export type BlockingReviewReadCheck = (review: WorkflowBlockingReview) => Promise<boolean>;

export interface IReadableBlockingReviewsService {
    filter(
        reviews: WorkflowBlockingReview[],
        canRead: BlockingReviewReadCheck
    ): Promise<WorkflowBlockingReview[]>;
}

/**
 * The first blocking reviews the caller can read, at most `MAX_BLOCKING_REVIEWS`, for the
 * delete-blocked error (D115, R57). Checks at most `MAX_BLOCKING_REVIEW_CHECKS` in the engine's
 * order, so a workflow with many unreadable reviews costs a bounded number of reads; a check that
 * throws counts as unreadable. The caller keeps the exact count.
 */
export const ReadableBlockingReviewsService = createAbstraction<IReadableBlockingReviewsService>(
    "ReadableBlockingReviewsService"
);

export namespace ReadableBlockingReviewsService {
    export type Interface = IReadableBlockingReviewsService;
    export type ReadCheck = BlockingReviewReadCheck;
    export type Reviews = WorkflowBlockingReview[];
    export type Return = Promise<WorkflowBlockingReview[]>;
}
