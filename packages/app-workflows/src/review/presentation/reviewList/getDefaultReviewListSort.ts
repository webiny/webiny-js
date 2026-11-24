import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";

/*
 * Work waiting to be done lists the longest-waiting item first: every scope but Requested by me at
 * In review or Failed, and the pool, which holds only waiting reviews. Everything else lists the
 * newest change first (QBZ-69, B2 design 1). Mirrors the API's `getDefaultReviewListSort`.
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
