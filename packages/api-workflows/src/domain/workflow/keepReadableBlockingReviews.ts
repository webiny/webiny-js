import type { WorkflowBlockingReview } from "./types.js";

/** At most this many blocking reviews are listed to the caller (D115). */
export const MAX_BLOCKING_REVIEWS = 5;

/** At most this many blocking reviews are checked for readability (R76). */
export const MAX_BLOCKING_REVIEW_CHECKS = 50;

/** The app's read check for one blocking review's target, as the caller. */
export type BlockingReviewReadCheck = (review: WorkflowBlockingReview) => Promise<boolean>;

/**
 * The first blocking reviews the caller can read, at most `MAX_BLOCKING_REVIEWS`, for the
 * delete-blocked error (D115, R57). Checks at most `MAX_BLOCKING_REVIEW_CHECKS` in the engine's
 * order, so a workflow with many unreadable reviews costs a bounded number of reads; a check that
 * throws counts as unreadable. The caller keeps the exact count.
 */
export const keepReadableBlockingReviews = async (
    reviews: WorkflowBlockingReview[],
    canRead: BlockingReviewReadCheck
): Promise<WorkflowBlockingReview[]> => {
    const readable: WorkflowBlockingReview[] = [];
    for (const review of reviews.slice(0, MAX_BLOCKING_REVIEW_CHECKS)) {
        if (readable.length === MAX_BLOCKING_REVIEWS) {
            break;
        }
        let allowed = false;
        try {
            allowed = await canRead(review);
        } catch {
            allowed = false;
        }
        if (allowed) {
            readable.push(review);
        }
    }
    return readable;
};
