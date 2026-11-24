import type { ReviewListScope } from "./ReviewListScope.js";
import type { ReviewListState } from "./ReviewListState.js";
import type { ReviewListSort } from "./types.js";

/**
 * The sort of a list without one (D119, B2 design 1): work waiting to be done, oldest change first
 * (every scope but `myRequests` with state `inReview` or `failed`, and the pool, which lists only
 * waiting reviews at any state); newest first otherwise. Pure; the admin mirrors it.
 */
export const getDefaultReviewListSort = (
    scope: ReviewListScope,
    state: ReviewListState
): ReviewListSort => {
    if (scope === "pool") {
        return "lastChangedOn_ASC";
    }
    if (scope !== "myRequests" && (state === "inReview" || state === "failed")) {
        return "lastChangedOn_ASC";
    }
    return "lastChangedOn_DESC";
};
