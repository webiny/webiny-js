import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";

// In review for the work queues, All for Requested by me and All (B2 design 1).
export const getDefaultReviewListState = (scope: ReviewListScope): ReviewListState => {
    if (scope === "myRequests" || scope === "all") {
        return "all";
    }
    return "inReview";
};
