import type { ReviewListState } from "./ReviewListState.js";
import type { ReviewData } from "./types.js";

/**
 * The "where" predicate of a list (B2 design 1). Pure; ANDed with `matchesReviewListScope`. The
 * storage pre-filter (`createReviewListWhere`) expresses the same conditions.
 */
export const matchesReviewListState = (review: ReviewData, state: ReviewListState): boolean => {
    switch (state) {
        case "all":
            return true;
        case "inReview":
            return review.state === "inProgress" && review.currentStepState !== "failed";
        case "failed":
            return review.state === "inProgress" && review.currentStepState === "failed";
        case "approved":
            return review.state === "approved";
        case "rejected":
            return review.state === "rejected";
    }
};
