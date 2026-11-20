import type { ReviewListScope } from "./ReviewListScope.js";
import type { ReviewListState } from "./ReviewListState.js";

/*
 * Scope and state pairs that list nothing by definition; mirrors the API's
 * `isEmptyReviewListFilter` (B2 design 1). The pool holds only waiting steps, and a failed step
 * (AI or automation) has no user owner.
 */
export const isEmptyReviewListFilter = (
    scope: ReviewListScope,
    state: ReviewListState
): boolean => {
    switch (scope) {
        case "pool":
            return state === "failed" || state === "approved" || state === "rejected";
        case "assignedToMe":
        case "teamInReview":
            return state === "failed";
        case "myRequests":
        case "all":
            return false;
    }
};
