import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";

/*
 * Every review of the collected refusals, once by `reviewId`, in order. Pure.
 */
export const mergeBlockingReviews = (collected: ActiveReviewOnTrashData[]): BlockingReview[] => {
    const seen = new Set<string>();
    const reviews: BlockingReview[] = [];

    for (const data of collected) {
        for (const review of data.reviews) {
            if (seen.has(review.reviewId)) {
                continue;
            }
            seen.add(review.reviewId);
            reviews.push(review);
        }
    }

    return reviews;
};
